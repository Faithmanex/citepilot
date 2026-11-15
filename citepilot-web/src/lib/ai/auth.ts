/**
 * API-key auth + rate limiting.
 *
 * Rate limiting is authoritative in Supabase (`consume_rate_limit`, migration
 * 016) so the limit holds across serverless instances. If the shared store is
 * unreachable the per-instance sliding window still applies and the degradation
 * is logged — a database outage must not disable abuse control, and it must not
 * deny every legitimate request either.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { aiConfig } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function jsonError(status: number, detail: string): NextResponse {
  return NextResponse.json({ detail }, { status });
}

/** Constant-time string comparison, so a wrong key leaks nothing by timing. */
function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

  if (!safeEqual(provided, expected)) {
    return jsonError(401, "Invalid or missing API key");
  }
  return null;
}

const RATE_WINDOW_MS = 60_000;
const RATE_WINDOW_SECONDS = 60;
const buckets = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { detail: "Rate limit exceeded. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
    }
  );
}

/** Per-instance sliding window: the fallback when the shared store is unusable. */
function checkLocalRateLimit(ip: string, limit: number): NextResponse | null {
  const now = Date.now();
  const bucket = (buckets.get(ip) || []).filter((t) => t > now - RATE_WINDOW_MS);

  if (bucket.length >= limit) {
    buckets.set(ip, bucket);
    return tooManyRequests(Math.ceil(RATE_WINDOW_MS / 1000));
  }

  bucket.push(now);
  buckets.set(ip, bucket);
  return null;
}

/**
 * Returns an error response when the rate limit is exceeded, else null.
 *
 * The shared counter is consumed first. `serviceRoleKey` is required for that
 * call because the RPC is revoked from anon/authenticated.
 */
export async function checkRateLimit(request: Request): Promise<NextResponse | null> {
  const limit = aiConfig.rateLimitPerMinute;
  if (limit <= 0) return null;

  const ip = clientIp(request);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (isSupabaseConfigured && hasServiceRole) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("consume_rate_limit", {
        p_key: `analyse:${ip}`,
        p_limit: limit,
        p_window_seconds: RATE_WINDOW_SECONDS,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0] as {
          allowed?: boolean;
          remaining?: number;
          reset_at?: string;
        };
        if (row.allowed) return null;
        const resetAt = row.reset_at ? new Date(row.reset_at).getTime() : 0;
        const retryAfter = resetAt
          ? Math.ceil((resetAt - Date.now()) / 1000)
          : RATE_WINDOW_SECONDS;
        return tooManyRequests(retryAfter);
      }

      console.warn(
        "[rate-limit] Shared limiter unavailable, applying the per-instance window:",
        error?.message || "no rows returned"
      );
    } catch (err) {
      console.warn(
        "[rate-limit] Shared limiter failed, applying the per-instance window:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return checkLocalRateLimit(ip, limit);
}

/** Strips temp paths / truncates error messages before returning them to clients. */
export function sanitizeErrorDetail(error: unknown): string {
  let msg = String(error);
  msg = msg.replace(/[A-Za-z]:\\[^\s]*/g, "[path]");
  msg = msg.replace(/\/tmp\/[^\s]*/g, "[path]");
  if (msg.length > 300) msg = `${msg.slice(0, 300)}…`;
  return msg;
}
