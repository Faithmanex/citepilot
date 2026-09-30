/**
 * API-key auth + in-memory sliding-window rate limiting.
 * Port of the FastAPI dependencies in
 * `citepilot-ai/src/citepilot_ai/api/v1/endpoints.py`.
 *
 * Note: in-memory buckets are best-effort per serverless instance (parity with
 * the Python single-process limiter).
 */
import { NextResponse } from "next/server";
import { aiConfig } from "./config";

function jsonError(status: number, detail: string): NextResponse {
  return NextResponse.json({ detail }, { status });
}

/** Returns an error response when the request fails API-key auth, else null. */
export function checkAuth(request: Request): NextResponse | null {
  const expected = aiConfig.apiKey;
  if (!expected) return null;

  let provided = "";
  const xApiKey = request.headers.get("x-api-key");
  const authorization = request.headers.get("authorization");
  if (xApiKey && xApiKey.trim()) {
    provided = xApiKey.trim();
  } else if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    provided = authorization.slice(7).trim();
  }

  if (provided !== expected) {
    return jsonError(401, "Invalid or missing API key");
  }
  return null;
}

const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

/** Returns an error response when the rate limit is exceeded, else null. */
export function checkRateLimit(request: Request): NextResponse | null {
  const limit = aiConfig.rateLimitPerMinute;
  if (limit <= 0) return null;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const bucket = (buckets.get(ip) || []).filter((t) => t > now - RATE_WINDOW_MS);

  if (bucket.length >= limit) {
    buckets.set(ip, bucket);
    return jsonError(429, "Rate limit exceeded. Please try again shortly.");
  }

  bucket.push(now);
  buckets.set(ip, bucket);
  return null;
}

/** Strips temp paths / truncates error messages before returning them to clients. */
export function sanitizeErrorDetail(error: unknown): string {
  let msg = String(error);
  msg = msg.replace(/[A-Za-z]:\\[^\s]*/g, "[path]");
  msg = msg.replace(/\/tmp\/[^\s]*/g, "[path]");
  if (msg.length > 300) msg = `${msg.slice(0, 300)}…`;
  return msg;
}
