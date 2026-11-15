/**
 * Gemini client with bounded attempts, error classification, and retries that
 * only run while the pipeline budget can still absorb them.
 */
import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { aiConfig } from "./config";

export type AIErrorKind =
  | "timeout"
  | "rate_limit"
  | "invalid_config"
  | "provider_error"
  | "budget_exhausted"
  | "invalid_response";

export class AIServiceError extends Error {
  readonly kind: AIErrorKind;
  readonly retryable: boolean;
  /** Safe-to-log provider detail. Never contains manuscript content or keys. */
  readonly providerDetail?: string;

  constructor(
    message: string,
    options: {
      kind?: AIErrorKind;
      retryable?: boolean;
      providerDetail?: string;
    } = {}
  ) {
    super(message);
    this.name = "AIServiceError";
    this.kind = options.kind ?? "provider_error";
    this.retryable =
      options.retryable ??
      (this.kind === "timeout" ||
        this.kind === "rate_limit" ||
        this.kind === "provider_error");
    this.providerDetail = options.providerDetail;
  }
}

/**
 * Classifies a provider SDK error without leaking its message into user-facing
 * copy. The raw message is only used to pick the category and to build a
 * sanitized detail string for server logs.
 */
export function classifyProviderError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) return error;

  const message = String(
    (error as { message?: unknown })?.message ?? error ?? ""
  );
  const status = Number(
    (error as { status?: unknown })?.status ??
      (error as { code?: unknown })?.code ??
      0
  );
  const detail = message.replace(/\s+/g, " ").slice(0, 300);

  // Quota/rate-limit signals win over credential heuristics. Providers can
  // return a quota failure with HTTP 403 or with digits that look like 401/403
  // inside a JSON body; classifying that as "misconfigured, do not retry" is
  // both wrong and user-hostile.
  if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|RATE_LIMIT_EXCEEDED|rate limit|quota|too many requests|429/i.test(
      message
    )
  ) {
    return new AIServiceError("The AI provider rate limit was reached.", {
      kind: "rate_limit",
      retryable: true,
      providerDetail: detail,
    });
  }

  if (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|API key not valid|UNAUTHENTICATED|PERMISSION_DENIED|invalid api key/i.test(
      message
    )
  ) {
    return new AIServiceError(
      "The configured Gemini credentials were rejected. Check GOOGLE_API_KEY.",
      { kind: "invalid_config", retryable: false, providerDetail: detail }
    );
  }

  if (
    /DEADLINE_EXCEEDED|ETIMEDOUT|timed? ?out|timeout|ECONNRESET|socket hang up/i.test(
      message
    ) ||
    status === 408 ||
    status === 504
  ) {
    return new AIServiceError("The AI provider timed out.", {
      kind: "timeout",
      retryable: true,
      providerDetail: detail,
    });
  }

  return new AIServiceError("The AI provider request failed.", {
    kind: "provider_error",
    retryable: true,
    providerDetail: detail,
  });
}

function budgetExhausted(stage: string): AIServiceError {
  return new AIServiceError(
    `Analysis time budget exhausted before ${stage}.`,
    { kind: "budget_exhausted", retryable: false }
  );
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiConfig.googleApiKey) {
    throw new AIServiceError(
      "GOOGLE_API_KEY is not set, so the Gemini provider cannot be called.",
      { kind: "invalid_config", retryable: false }
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

/**
 * Milliseconds left before `deadline` (an epoch timestamp). `Infinity` when no
 * deadline was supplied.
 */
function remainingMs(deadline?: number): number {
  if (!deadline) return Number.POSITIVE_INFINITY;
  return deadline - Date.now();
}

/**
 * Races a promise against a wall-clock timeout. The SDK's own `httpOptions`
 * timeout is not enough on its own: a hung socket, DNS stall, or a provider
 * that ignores the setting can otherwise outlive the function budget.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.reject(
      new AIServiceError(`${label} was not started: no time budget remained.`, {
        kind: "budget_exhausted",
        retryable: false,
      })
    );
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new AIServiceError(`${label} timed out after ${Math.round(ms / 1000)}s.`, {
          kind: "timeout",
          retryable: true,
        })
      );
    }, ms);
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
 * Calls the configured Gemini model with bounded retries on transient errors.
 * Returns raw text. Throws a classified `AIServiceError` when every attempt
 * fails. There are intentionally no fallback models: one model
 * (`GEMINI_MODEL`), retried with backoff.
 *
 * `deadline` is an epoch timestamp: once it passes (or too little time remains
 * to complete an attempt), no further attempt or backoff sleep is started, so a
 * slow document can't run the function past the platform timeout.
 */
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  deadline?: number
): Promise<string> {
  const ai = getClient();
  const model = aiConfig.geminiModel;
  if (!model) {
    throw new AIServiceError("GEMINI_MODEL is empty.", {
      kind: "invalid_config",
      retryable: false,
    });
  }

  let lastError: AIServiceError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remaining = remainingMs(deadline);
    if (remaining <= aiConfig.minAttemptMs) {
      throw lastError && lastError.kind === "budget_exhausted"
        ? lastError
        : budgetExhausted(`calling the ${model} model`);
    }

    const attemptTimeout = Math.max(
      aiConfig.minAttemptMs,
      Math.min(aiConfig.geminiTimeoutMs, remaining)
    );

    try {
      const request = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.1,
          topP: 0.95,
          responseMimeType: "application/json",
          httpOptions: { timeout: attemptTimeout },
          ...(systemInstruction ? { systemInstruction } : {}),
        },
      });
      const response = await withTimeout(
        request,
        attemptTimeout,
        `Gemini call to ${model}`
      );
      const text = response.text;
      if (text) return text;
      lastError = new AIServiceError("The AI provider returned an empty response.", {
        kind: "invalid_response",
        retryable: true,
      });
    } catch (error) {
      lastError = classifyProviderError(error);
      // Invalid credentials/configuration never succeed on retry.
      if (!lastError.retryable) throw lastError;
    }

    if (attempt < 2) {
      const backoff = 2 ** attempt * 1000 + 500;
      if (remainingMs(deadline) <= backoff + aiConfig.minAttemptMs) break;
      await sleep(backoff);
    }
  }

  throw (
    lastError ??
    new AIServiceError(`Gemini API execution failed on model ${model}.`, {
      kind: "provider_error",
      retryable: true,
    })
  );
}

/**
 * Extracts a JSON object from raw LLM output (direct, fenced, or embedded).
 * Throws when no JSON object can be recovered — an empty or malformed model
 * response must surface as an error, never as silently empty findings.
 */
export function extractJson(text: string): unknown {
  if (!text) {
    throw new AIServiceError("Model returned an empty response.", {
      kind: "invalid_response",
      retryable: true,
    });
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

  throw new AIServiceError("Model response did not contain valid JSON.", {
    kind: "invalid_response",
    retryable: true,
  });
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
      `Model output did not match the expected schema: ${parsed.error.message}`,
      { kind: "invalid_response", retryable: true }
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
  /** Epoch timestamp after which no further attempt is started. */
  deadline?: number;
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
  let lastError: unknown = new AIServiceError(
    "Model returned no usable result.",
    { kind: "invalid_response", retryable: true }
  );
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (remainingMs(opts.deadline) <= aiConfig.minAttemptMs) {
      throw lastError instanceof AIServiceError &&
        (lastError.kind === "invalid_config" || lastError.kind === "budget_exhausted")
        ? lastError
        : budgetExhausted("a provider response could be validated");
    }
    try {
      const raw = await callGemini(prompt, systemInstruction, opts.deadline);
      const parsed = parseAndValidate(raw, schema);
      const rule = opts.nonEmptyIfInputOver;
      if (rule && rule.inputChars > (rule.threshold ?? 1000)) {
        const allEmpty = rule.keys.every((k) => {
          const v = (parsed as Record<string, unknown>)[k];
          return !Array.isArray(v) || v.length === 0;
        });
        if (allEmpty) {
          throw new AIServiceError(
            "Model returned an empty result for substantial input.",
            { kind: "invalid_response", retryable: true }
          );
        }
      }
      return parsed;
    } catch (err) {
      lastError = err;
      const classified =
        err instanceof AIServiceError ? err : classifyProviderError(err);
      if (!classified.retryable) throw classified;
      if (attempt < retries) {
        const backoff = 1500 * (attempt + 1);
        if (remainingMs(opts.deadline) <= backoff + aiConfig.minAttemptMs) break;
        await sleep(backoff);
      }
    }
  }
  throw lastError;
}
