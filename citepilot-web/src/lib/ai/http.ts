/**
 * Shared HTTP helpers for external bibliographic APIs.
 * Port of `citepilot-ai/src/citepilot_ai/services/http_client.py` using fetch.
 */
import { aiConfig } from "./config";

function userAgent(): string {
  return `CitePilot-Academic-Auditor/1.0 (mailto:${aiConfig.crossrefMailto})`;
}

/** GET JSON with a hard timeout; returns null on any failure (network/timeout/status). */
export async function getJson(
  url: string,
  timeoutMs = 10_000
): Promise<Record<string, unknown> | null> {
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
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
