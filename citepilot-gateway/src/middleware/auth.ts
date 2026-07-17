import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthUser {
  userId: string;
  email: string;
  tier: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      data: null,
      errors: [{ code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" }],
      meta: { requestId: req.headers["x-request-id"] },
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      data: null,
      errors: [{ code: "TOKEN_EXPIRED", message: "Access token expired or invalid" }],
      meta: { requestId: req.headers["x-request-id"] },
    });
  }
}
