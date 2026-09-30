/**
 * Jev (TypeSafe System One) decision layer — opt-in verification enrichment.
 *
 * Node port note: the upstream Python service used the `typesafe-sdk` Python
 * package. There is no Node SDK, and Jev is disabled by default (no key), so
 * this module is a fail-open no-op: it returns matches unchanged and never
 * throws. When `TYPESAFE_API_KEY` is configured but no Node SDK is available,
 * it still returns matches unchanged (Gemini verdict preserved).
 */
import { aiConfig } from "./config";
import type { MatchEntry } from "./types";

export const RELATION_TO_VERDICT: Record<string, string> = {
  supports: "verified",
  contradicts: "contradicted",
  says_nothing: "unsupported",
};

export function isJevEnabled(): boolean {
  return Boolean(aiConfig.typesafeEnabled && aiConfig.typesafeApiKey);
}

export function buildJevQuestionPayload(): Record<string, unknown> {
  return {
    relation: {
      type: "choice",
      instructions: "How does the section relate to the claim?",
      criteria: {
        supports: "The section states the claim or directly implies that it is true",
        contradicts: "The section states the opposite of the claim or implies it is false",
        says_nothing: "The section does not address what the claim asserts, either way",
      },
    },
  };
}

/**
 * No-op enrichment: returns the matches unchanged. Present for API parity and
 * so the pipeline can call it unconditionally without branching.
 */
export async function enrichMatchesWithJev(
  matches: MatchEntry[]
): Promise<MatchEntry[]> {
  return matches;
}
