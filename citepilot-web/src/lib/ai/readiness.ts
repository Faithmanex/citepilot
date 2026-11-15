/**
 * Provider readiness, distinct from process liveness.
 *
 * A configured API key proves nothing about whether the provider accepts it or
 * whether the configured model exists. Readiness is therefore only reported as
 * `ready` after a real (tiny) provider call. Probes are cached so the health
 * endpoint can be polled without generating provider traffic.
 */
import { GoogleGenAI } from "@google/genai";
import { aiConfig } from "./config";

export type ReadinessState = "ready" | "unavailable" | "unverified";

export interface ProviderReadiness {
  state: ReadinessState;
  /** ISO timestamp of the last real provider probe, if any. */
  checked_at: string | null;
  /** Short, safe-to-expose explanation. */
  detail: string;
  /** `probe` = fresh provider call, `cache` = recent probe, `configuration` = key presence only. */
  source: "probe" | "cache" | "configuration";
}

let cache: { state: "ready" | "unavailable"; checkedAt: number; detail: string } | null =
  null;
let inFlight: Promise<ProviderReadiness> | null = null;

const NO_KEY_DETAIL =
  "GOOGLE_API_KEY is not configured, so analysis cannot run.";

export function getCachedReadiness(): ProviderReadiness | null {
  if (!cache) return null;
  const age = Date.now() - cache.checkedAt;
  if (age > aiConfig.readinessCacheMs) return null;
  return {
    state: cache.state,
    checked_at: new Date(cache.checkedAt).toISOString(),
    detail: cache.detail,
    source: "cache",
  };
}

/**
 * Configuration-only information: the key exists, but the provider has not
 * been contacted. Never presented as "ready".
 */
export function getConfigurationReadiness(): ProviderReadiness {
  if (!aiConfig.googleApiKey) {
    return {
      state: "unavailable",
      checked_at: null,
      detail: NO_KEY_DETAIL,
      source: "configuration",
    };
  }
  return {
    state: "unverified",
    checked_at: null,
    detail:
      "An API key is configured, but the provider connection has not been verified. Call /api/health?probe=1 to run a real check.",
    source: "configuration",
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Provider probe timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Performs a real, minimal provider call and caches the outcome. Concurrent
 * callers share one probe.
 */
export async function probeProvider(): Promise<ProviderReadiness> {
  if (!aiConfig.googleApiKey) {
    return {
      state: "unavailable",
      checked_at: null,
      detail: NO_KEY_DETAIL,
      source: "configuration",
    };
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const startedAt = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: aiConfig.googleApiKey });
      await withTimeout(
        ai.models.generateContent({
          model: aiConfig.geminiModel,
          contents: "Reply with the single word: ok",
          config: {
            temperature: 0,
            maxOutputTokens: 16,
          },
        }),
        aiConfig.readinessProbeTimeoutMs
      );
      cache = {
        state: "ready",
        checkedAt: startedAt,
        detail: `Provider responded using model ${aiConfig.geminiModel}.`,
      };
    } catch (error) {
      const message = String((error as { message?: unknown })?.message ?? error);
      const detail = /API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|401|403/i.test(
        message
      )
        ? "The provider rejected the request (credentials or project permissions)."
        : /NOT_FOUND|404|model/i.test(message) &&
            /not found|not supported|does not exist/i.test(message)
          ? `The configured model (${aiConfig.geminiModel}) is not available to this account.`
          : /INVALID_ARGUMENT|invalid argument/i.test(message)
            ? "The provider rejected the probe request as invalid."
            : /DEADLINE_EXCEEDED|ETIMEDOUT|timed out|timeout/i.test(message)
              ? "The provider probe timed out."
              : "The provider probe failed.";
      cache = { state: "unavailable", checkedAt: startedAt, detail };
    } finally {
      inFlight = null;
    }
    return {
      state: cache.state,
      checked_at: new Date(cache.checkedAt).toISOString(),
      detail: cache.detail,
      source: "probe" as const,
    };
  })();

  return inFlight;
}
