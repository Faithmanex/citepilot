/**
 * Runtime configuration for the CitePilot AI service.
 *
 * This is the Node/TypeScript port of `citepilot-ai/src/citepilot_ai/config.py`.
 * All values are read from server-side environment variables (Vercel project env).
 */

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const aiConfig = {
  googleApiKey: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim(),
  geminiModel: (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim(),
  logLevel: (process.env.LOG_LEVEL || "info").toLowerCase(),
  crossrefMailto: (process.env.CROSSREF_MAILTO || "support@citepilot.ai").trim(),
  // Security / limits
  apiKey: (process.env.API_KEY || "").trim(),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  maxTextChars: num(process.env.MAX_TEXT_CHARS, 200_000),
  rateLimitPerMinute: num(process.env.RATE_LIMIT_PER_MINUTE, 60),
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

/** Gemini candidate models, tried in order (deduped, preserving order). */
export const FALLBACK_MODELS: string[] = Array.from(
  new Set(
    [
      aiConfig.geminiModel,
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ].filter((m): m is string => Boolean(m))
  )
);
