/**
 * Gemini client with exponential-backoff retries and fallback models.
 */
import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { aiConfig, FALLBACK_MODELS } from "./config";

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiConfig.googleApiKey) {
    throw new AIServiceError(
      "GOOGLE_API_KEY is not set. Gemini API requires a valid API key."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: aiConfig.googleApiKey });
  }
  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs async tasks with at most `limit` in flight, collecting settled
 * results in input order. Used to cap Gemini burst concurrency on large
 * documents so chunk fan-outs don't self-inflict 429 quota errors.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next;
      next += 1;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

const RETRYABLE = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED/;

/**
 * Calls Gemini with retries across candidate models. Returns raw text.
 * Throws `AIServiceError` when every candidate fails.
 */
export async function callGemini(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const ai = getClient();
  let lastError: unknown = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.1,
            topP: 0.95,
            responseMimeType: "application/json",
            ...(systemInstruction ? { systemInstruction } : {}),
          },
        });
        const text = response.text;
        if (text) return text;
      } catch (error) {
        lastError = error;
        if (RETRYABLE.test(String(error))) {
          await sleep(2 ** attempt * 1000 + 500);
        } else {
          break;
        }
      }
    }
  }

  throw new AIServiceError(
    `Gemini API execution failed across all candidate models. Last error: ${lastError}`
  );
}

/**
 * Extracts a JSON object from raw LLM output (direct, fenced, or embedded).
 * Throws when no JSON object can be recovered — an empty or malformed model
 * response must surface as an error, never as silently empty findings.
 */
export function extractJson(text: string): unknown {
  if (!text) {
    throw new AIServiceError("Model returned an empty response.");
  }

  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }

  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }

  throw new AIServiceError("Model response did not contain valid JSON.");
}

/**
 * Validates raw LLM output against a zod schema. Throws `AIServiceError` when
 * the output does not match the schema, so a malformed model response is
 * reported instead of being coerced into an empty result.
 */
export function parseAndValidate<T>(raw: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(extractJson(raw));
  if (!parsed.success) {
    throw new AIServiceError(
      `Model output did not match the expected schema: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

export interface ValidatedCallOptions {
  /** Extra attempts after the first try (default 2). */
  retries?: number;
  /**
   * When set and `inputChars` exceeds `threshold` (default 1000), a result
   * whose listed arrays are ALL empty is treated as a degraded model response
   * and retried — a substantial input almost never yields legitimately zero
   * findings. Omit for calls where empty is a common legitimate outcome
   * (e.g. style warnings, uncited claims on clean text).
   */
  nonEmptyIfInputOver?: {
    keys: string[];
    inputChars: number;
    threshold?: number;
  };
}

/**
 * Calls Gemini and validates the response, retrying transient degradations:
 * malformed JSON/schema mismatches, and (when configured) suspiciously empty
 * results for substantial inputs. Throws the last `AIServiceError` when every
 * attempt is exhausted, so persistent failures still surface loudly.
 */
export async function callGeminiValidated<T extends Record<string, unknown>>(
  prompt: string,
  systemInstruction: string | undefined,
  schema: z.ZodType<T>,
  opts: ValidatedCallOptions = {}
): Promise<T> {
  const retries = opts.retries ?? 2;
  let lastError: unknown = new AIServiceError("Model returned no usable result.");
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const raw = await callGemini(prompt, systemInstruction);
      const parsed = parseAndValidate(raw, schema);
      const rule = opts.nonEmptyIfInputOver;
      if (rule && rule.inputChars > (rule.threshold ?? 1000)) {
        const allEmpty = rule.keys.every((k) => {
          const v = (parsed as Record<string, unknown>)[k];
          return !Array.isArray(v) || v.length === 0;
        });
        if (allEmpty) {
          throw new AIServiceError(
            "Model returned an empty result for substantial input."
          );
        }
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError;
}
