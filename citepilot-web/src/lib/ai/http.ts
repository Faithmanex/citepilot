/**
 * Shared HTTP helpers for external bibliographic APIs.
 * Port of `citepilot-ai/src/citepilot_ai/services/http_client.py` using fetch.
 */
import { aiConfig } from "./config";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function userAgent(): string {
  return `CitePilot-Academic-Auditor/1.0 (mailto:${aiConfig.crossrefMailto})`;
}

/**
 * GET JSON with a hard timeout. Throws `HttpError` on a non-2xx response and a
 * generic error on network failure or timeout, so callers can distinguish a
 * genuine "not found" (404) from an outage instead of treating both as a miss.
 */
export async function getJson(
  url: string,
  timeoutMs = 10_000
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
      throw new HttpError(response.status, `HTTP ${response.status} for ${url}`);
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new Error(`Request to ${url} failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
