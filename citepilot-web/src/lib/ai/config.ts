/**
 * Runtime configuration for the CitePilot AI service.
 *
 * All values are read from server-side environment variables (Vercel project env).
 */

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Vercel terminates the function at `maxDuration` in the route module (60s).
 * The pipeline must finish *before* that, leaving headroom to serialize a
 * response. The response budget therefore stays below the platform cap.
 */
const PLATFORM_MAX_DURATION_MS = 60_000;
const RESPONSE_HEADROOM_MS = 5_000;

export const aiConfig = {
  googleApiKey: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim(),
  // `gemini-3.8-flash` is listed for this account but did not return within 90
  // seconds on a minimal request (2026-11-14), which made every audit hit the
  // deadline. `gemini-3.1-flash-lite` answered in 1.7s (2026-11-15) and is the
  // default; `gemini-2.5-flash` is also verified. Override with GEMINI_MODEL.
  geminiModel: (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim(),
  logLevel: (process.env.LOG_LEVEL || "info").toLowerCase(),
  crossrefMailto: (process.env.CROSSREF_MAILTO || "support@citepilot.ai").trim(),
  // OpenAlex dropped the `mailto` polite pool in February 2026; a free key is
  // now the only way past 10 req/s and the tiny keyless daily budget. Keyless
  // requests from a shared cloud IP (Vercel) are routinely 429'd.
  openalexApiKey: (process.env.OPENALEX_API_KEY || "").trim(),
  // Security / limits
  apiKey: (process.env.API_KEY || "").trim(),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  maxTextChars: num(process.env.MAX_TEXT_CHARS, 200_000),
  rateLimitPerMinute: num(process.env.RATE_LIMIT_PER_MINUTE, 60),
  // Latency budgets. Every stage checks the deadline and degrades instead of
  // running the function past the platform timeout.
  platformMaxDurationMs: PLATFORM_MAX_DURATION_MS,
  analysisBudgetMs: Math.min(
    num(process.env.ANALYSIS_BUDGET_MS, 52_000),
    PLATFORM_MAX_DURATION_MS - RESPONSE_HEADROOM_MS
  ),
  // Per-provider-call ceiling. A single Gemini call may never consume the whole
  // budget: later stages (matching, style, verification) still need time.
  // 28s covers this provider's observed tail (a trivial call can take 27s).
  geminiTimeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 28_000),
  // Minimum time that must remain before starting another provider attempt.
  minAttemptMs: num(process.env.MIN_ATTEMPT_MS, 2_000),
  // Gemini calls are gated globally so a single audit can't fan out without
  // bound. The default covers the three stages that start together: if the gate
  // is lower, the third call waits for a slot and can lose its whole window to
  // the queue rather than to the provider.
  llmConcurrency: Math.max(1, num(process.env.LLM_CONCURRENCY, 3)),
  verifyConcurrency: num(process.env.VERIFY_CONCURRENCY, 6),
  // Provider verification requests get their own short ceiling so a slow
  // Crossref/OpenAlex response cannot hold the whole audit open.
  verifyTimeoutMs: num(process.env.VERIFY_TIMEOUT_MS, 8_000),
  // Readiness probes are cached so `/health` never fans out a provider call per
  // request.
  readinessCacheMs: num(process.env.READINESS_CACHE_MS, 300_000),
  readinessProbeTimeoutMs: num(process.env.READINESS_PROBE_TIMEOUT_MS, 6_000),
} as const;

export const SERVICE_VERSION = "0.1.0";

export const ALLOWED_CITATION_STYLES = new Set([
  "apa7",
  "apa6",
  "harvard",
  "vancouver",
  "chicago-author-date",
  "chicago-notes",
  "mla9",
  "ieee",
  "oscola",
  "turabian",
]);

/**
 * Client style keys that predate the canonical server list. Normalizing here
 * keeps saved history and older clients working instead of returning a 400.
 */
const STYLE_ALIASES: Record<string, string> = {
  chicago17: "chicago-author-date",
  chicago: "chicago-author-date",
  "chicago-author-date": "chicago-author-date",
  "chicago-notes": "chicago-notes",
  mla: "mla9",
  apa: "apa7",
  "apa-7": "apa7",
  "apa-6": "apa6",
};

export function normalizeCitationStyle(raw: string | null | undefined): string | null {
  const value = String(raw ?? "apa7").trim().toLowerCase();
  const mapped = STYLE_ALIASES[value] || value;
  return ALLOWED_CITATION_STYLES.has(mapped) ? mapped : null;
}
