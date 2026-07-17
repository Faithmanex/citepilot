import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../../db/index.js";
import { users, sessions } from "../../db/schema.js";
import { config } from "../../config.js";
import { AppError } from "../../middleware/error-handler.js";
import { eq, and, isNull } from "drizzle-orm";

function generateTokens(userId: string, email: string, tier: string, role: string) {
  const accessToken = jwt.sign({ userId, email, tier, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = `rt_${crypto.randomBytes(32).toString("hex")}`;
  return { accessToken, refreshToken };
}

export async function register(email: string, password: string, name: string) {
  const existing = await db.select().from(users).where(
    and(eq(users.email, email), isNull(users.deletedAt)),
  ).limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const inserted = await db.insert(users).values({
    email,
    passwordHash,
    name,
  }).returning();
  const user = inserted[0]!;

  const tokens = generateTokens(user.id, user.email, user.tier, user.role);
  const refreshHash = crypto.createHash("sha256").update(tokens.refreshToken).digest("hex");

  await db.insert(sessions).values({
    userId: user.id,
    refreshTokenHash: refreshHash,
    expiresAt: new Date(Date.now() + config.jwt.refreshExpiresIn * 1000),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      createdAt: user.createdAt,
    },
    ...tokens,
    expiresIn: config.jwt.expiresIn,
  };
}

export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(
    and(eq(users.email, email), isNull(users.deletedAt)),
  ).limit(1);

  if (!user || !user.passwordHash) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email/password combination incorrect");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email/password combination incorrect");
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const tokens = generateTokens(user.id, user.email, user.tier, user.role);
  const refreshHash = crypto.createHash("sha256").update(tokens.refreshToken).digest("hex");

  await db.insert(sessions).values({
    userId: user.id,
    refreshTokenHash: refreshHash,
    expiresAt: new Date(Date.now() + config.jwt.refreshExpiresIn * 1000),
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: config.jwt.expiresIn,
    tokenType: "Bearer",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
    },
  };
}

export async function refresh(refreshToken: string) {
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const [session] = await db.select().from(sessions).where(
    and(eq(sessions.refreshTokenHash, hash), isNull(sessions.revokedAt)),
  ).limit(1);

  if (!session || session.expiresAt < new Date()) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token expired or invalid");
  }

  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "User not found");
  }

  const tokens = generateTokens(user.id, user.email, user.tier, user.role);
  const newHash = crypto.createHash("sha256").update(tokens.refreshToken).digest("hex");

  await db.insert(sessions).values({
    userId: user.id,
    refreshTokenHash: newHash,
    expiresAt: new Date(Date.now() + config.jwt.refreshExpiresIn * 1000),
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: config.jwt.expiresIn,
    tokenType: "Bearer",
  };
}

export async function logout(refreshToken: string) {
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.refreshTokenHash, hash));
}
