/**
 * Gemini client with exponential-backoff retries and fallback models.
 * Node port of `citepilot-ai/src/citepilot_ai/services/llm.py`.
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

/** Extracts a JSON object from raw LLM output (direct, fenced, or embedded). */
export function extractJson(text: string): unknown {
  if (!text) return {};

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

  return {};
}

/**
 * Validates raw LLM output against a zod schema. On any failure, returns the
 * schema's default instance (`schema.parse({})`), matching the Python behavior
 * of falling back to an empty model rather than throwing.
 */
export function parseAndValidate<T>(raw: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(extractJson(raw));
  if (parsed.success) return parsed.data;
  return schema.parse({});
}
