import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import documentRoutes from "./modules/documents/documents.routes.js";
import resultRoutes from "./modules/results/results.routes.js";
import analysisRoutes from "./modules/analysis/analysis.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, _res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] ?? `req_${crypto.randomUUID().slice(0, 12)}`;
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "citepilot-gateway", timestamp: new Date().toISOString() });
});

app.get("/health/ready", async (_req, res) => {
  try {
    const { db } = await import("./db/index.js");
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/documents", resultRoutes);
app.use("/api/v1/documents", analysisRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`citepilot-gateway listening on port ${config.port}`);
});

export default app;
