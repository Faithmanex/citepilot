/**
 * Shared HTTP helpers for external bibliographic APIs.
 */
import { aiConfig } from "./config";

export class HttpError extends Error {
  readonly status: number;
  /** Server-requested wait before retrying, when the response specifies one. */
  readonly retryAfterMs?: number;

  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function userAgent(): string {
  return `CitePilot-Academic-Auditor/1.0 (mailto:${aiConfig.crossrefMailto})`;
}

/**
 * A failure worth retrying: a rate limit, a server error, a network error, or a
 * timeout. A 404 or any other 4xx is an answer, not an outage.
 */
function isTransient(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 429 || error.status >= 500;
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJsonOnce(
  url: string,
  timeoutMs: number
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent(),
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
      throw new HttpError(
        response.status,
        `HTTP ${response.status} for ${url}`,
        Number.isFinite(retryAfterMs) ? retryAfterMs : undefined
      );
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new Error(`Request to ${url} failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET JSON with a hard timeout. Throws `HttpError` on a non-2xx response and a
 * generic error on network failure or timeout, so callers can distinguish a
 * genuine "not found" (404) from an outage instead of treating both as a miss.
 *
 * Transient failures are retried. Rate limits (429) get two longer, bounded
 * waits because Crossref throttles bursts; other transient failures get one
 * quick retry. Without this, a single throttled request turns an otherwise
 * complete audit into a "partial" one.
 */
export async function getJson(
  url: string,
  timeoutMs = 10_000
): Promise<Record<string, unknown>> {
  const rateLimitBackoff = [1_000, 2_500];
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await getJsonOnce(url, attempt === 0 ? timeoutMs : Math.min(timeoutMs, 8_000));
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) throw error;

      const isRateLimit = error instanceof HttpError && error.status === 429;
      // Non-rate-limit transients get exactly one retry.
      if (!isRateLimit && attempt > 0) throw error;

      const honoured =
        error instanceof HttpError && error.retryAfterMs
          ? Math.min(error.retryAfterMs, 2_500)
          : 0;
      const wait = isRateLimit
        ? Math.max(rateLimitBackoff[Math.min(attempt, rateLimitBackoff.length - 1)], honoured)
        : Math.max(500, honoured);
      await sleep(wait);
    }
  }
  throw lastError;
}
