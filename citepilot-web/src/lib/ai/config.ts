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

export const aiConfig = {
  googleApiKey: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim(),
  geminiModel: (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim(),
  logLevel: (process.env.LOG_LEVEL || "info").toLowerCase(),
  crossrefMailto: (process.env.CROSSREF_MAILTO || "support@citepilot.ai").trim(),
  // Security / limits
  apiKey: (process.env.API_KEY || "").trim(),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  maxTextChars: num(process.env.MAX_TEXT_CHARS, 200_000),
  rateLimitPerMinute: num(process.env.RATE_LIMIT_PER_MINUTE, 60),
  // Latency budgets. Vercel kills the function at `maxDuration` (60s), so the
  // pipeline must finish inside a smaller budget and report degraded results
  // instead of being terminated mid-response (FUNCTION_INVOCATION_TIMEOUT).
  analysisBudgetMs: num(process.env.ANALYSIS_BUDGET_MS, 50_000),
  geminiTimeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 25_000),
  verifyConcurrency: num(process.env.VERIFY_CONCURRENCY, 6),
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
