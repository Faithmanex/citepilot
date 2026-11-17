/**
 * Shared document-analysis orchestration.
 *
 * Every stage is individually bounded and individually reported. A failure in
 * one stage degrades the audit to `partial` and is surfaced through `checks`
 * instead of being turned into an empty (falsely clean) result.
 */
import { aiConfig } from "./config";
import {
  checkStyle,
  extractCitations,
  matchCitationsToReferences,
  parseReferences,
} from "./citation-extractor";
import { mapWithConcurrency } from "./llm";
import { validateReferenceWithCrossref } from "./crossref";
import { validateReferenceWithOpenalex } from "./openalex";
import { validateReferenceWithOpenLibrary } from "./openlibrary";
import { detectUncitedClaims } from "./uncited-claims";
import { calculatePublicationRecency } from "./recency";
import { checkRetractionStatus } from "./retraction";
import { logStage } from "./log";
import type {
  CheckStatus,
  CitationEntry,
  JsonObject,
  MatchEntry,
  ParagraphMeta,
  ReferenceEntry,
} from "./types";

function normalizeKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface PipelineResult {
  citations: JsonObject[];
  references: JsonObject[];
  matches: MatchEntry[];
  style_warnings: JsonObject[];
  uncited_claims: JsonObject[];
  recency: JsonObject;
  /** `completed` only when every attempted stage succeeded. */
  status: "completed" | "partial";
  checks: CheckStatus[];
}

export interface PipelineContext {
  requestId?: string;
  /** Overall deadline (epoch ms). Defaults to now + ANALYSIS_BUDGET_MS. */
  deadline?: number;
}

const STAGE_LABELS = {
  citations: "In-text citation extraction",
  references: "Reference list parsing",
  uncited_claims: "Uncited claim detection",
  matching: "Citation-to-reference matching",
  style: "Citation style checking",
  verification: "Crossref / OpenAlex verification",
} as const;

function describeError(error: unknown): { kind: string; message: string } {
  const kind = String((error as { kind?: unknown })?.kind || "provider_error");
  switch (kind) {
    case "budget_exhausted":
      return {
        kind,
        message:
          "This check could not finish within the analysis time limit. Re-run the audit on a shorter manuscript, or verify these items manually.",
      };
    case "invalid_config":
      return {
        kind,
        message:
          "The AI provider denied access to the analysis service, so this check could not run. This is a credentials or project-permission problem; retrying will not help until an administrator fixes it. The manuscript was preserved.",
      };
    case "rate_limit":
      return {
        kind,
        message:
          "The AI provider rate limit was reached, so this check could not complete. Wait a minute and retry the audit.",
      };
    case "timeout":
      return {
        kind,
        message:
          "The AI provider timed out before this check completed. Retrying may succeed.",
      };
    case "invalid_response":
      return {
        kind,
        message:
          "The AI provider returned an unusable response for this check. Retrying may succeed.",
      };
    default:
      return {
        kind,
        message:
          "The AI provider failed while running this check. Retrying may succeed.",
      };
  }
}

export async function runAnalysisPipeline(
  bodyText: string,
  refText: string,
  paraMeta: ParagraphMeta[],
  citationStyle: string,
  context: PipelineContext = {}
): Promise<PipelineResult> {
  const requestId = context.requestId || "req_unknown";
  const deadline = context.deadline ?? Date.now() + aiConfig.analysisBudgetMs;
  const checks: CheckStatus[] = [];

  const record = (check: CheckStatus) => {
    checks.push(check);
    logStage({
      requestId,
      stage: check.name,
      status: check.status,
      durationMs: check.duration_ms ?? 0,
    });
  };

  const runStage = async <T>(
    name: CheckStatus["name"],
    enabled: boolean,
    task: () => Promise<T>
  ): Promise<{ value: T | null; error: unknown | null; skipped: boolean }> => {
    const stageStart = Date.now();
    if (!enabled) {
      record({
        name,
        label: STAGE_LABELS[name],
        status: "skipped",
        reason: "not_applicable",
        message: "Not applicable to this audit mode or document.",
        duration_ms: 0,
      });
      return { value: null, error: null, skipped: true };
    }
    if (Date.now() >= deadline) {
      record({
        name,
        label: STAGE_LABELS[name],
        status: "skipped",
        reason: "budget",
        message: "Skipped because the analysis time budget ran out.",
        duration_ms: 0,
      });
      return { value: null, error: null, skipped: true };
    }
    try {
      const value = await task();
      record({
        name,
        label: STAGE_LABELS[name],
        status: "completed",
        duration_ms: Date.now() - stageStart,
      });
      return { value, error: null, skipped: false };
    } catch (error) {
      const described = describeError(error);
      record({
        name,
        label: STAGE_LABELS[name],
        status: "unavailable",
        message: described.message,
        duration_ms: Date.now() - stageStart,
      });
      if (described.kind === "budget_exhausted") {
        // Budget expiry is expected degradation, not a hard failure.
        return { value: null, error, skipped: true };
      }
      return { value: null, error, skipped: false };
    }
  };

  // A single stage may never consume the whole audit budget. Without this, one
  // hung model call starves every check that still had time to run, turning a
  // mostly-complete audit into an empty one.
  //
  // There is deliberately no retry here: a provider timeout already consumed a
  // full attempt window, and retrying it doubled the worst case (52s for one
  // reference-parsing call) while starving every later check. The provider call
  // itself still retries transient 5xx/429/network errors.
  const STAGE_BUDGET_MS = 28_000;

  const withStageBudget = <T>(
    task: (attemptDeadline: number) => Promise<T>
  ): (() => Promise<T>) => {
    return () => {
      const stageEnd = Math.min(deadline, Date.now() + STAGE_BUDGET_MS);
      return task(stageEnd);
    };
  };

  const citationsStage = await runStage(
    "citations",
    Boolean(bodyText),
    withStageBudget((attemptDeadline) =>
      extractCitations(bodyText, citationStyle, attemptDeadline)
    )
  );

  const [refsStage, claimsStage] = await Promise.all([
    runStage(
      "references",
      Boolean(refText),
      withStageBudget((attemptDeadline) =>
        parseReferences(refText, attemptDeadline)
      )
    ),
    runStage(
      "uncited_claims",
      Boolean(bodyText),
      withStageBudget((attemptDeadline) =>
        detectUncitedClaims(bodyText, paraMeta, attemptDeadline)
      )
    ),
  ]);

  const citations = citationsStage.value ?? [];
  const refs = refsStage.value ?? [];
  const uncitedClaims = claimsStage.value ?? [];

  const runVerification = async () => {
    const verificationStart = Date.now();
    const verification = await verifyReferences(refs, deadline);
    const verificationAttempted = refs.length > 0;
    record({
      name: "verification",
      label: STAGE_LABELS.verification,
      status: verificationAttempted
        ? verification.unavailableCount > 0
          ? "unavailable"
          : "completed"
        : "skipped",
      ...(verificationAttempted && verification.unavailableCount === refs.length
        ? {
            message:
              "Metadata verification was unavailable for every reference. These references are unverified, not confirmed correct.",
          }
        : verificationAttempted && verification.unavailableCount > 0
          ? {
              message: `${verification.unavailableCount} of ${refs.length} references could not be verified.`,
            }
          : !verificationAttempted
            ? { reason: "not_applicable", message: "No reference entries were available to verify." }
            : {}),
      duration_ms: Date.now() - verificationStart,
    });
    return verification;
  };

  // Matching, style checking, and metadata verification are independent once
  // citations and references exist. Running them concurrently keeps the audit
  // inside its budget instead of paying for each stage serially.
  const verificationPromise = runVerification();
  const matchStage = await runStage(
    "matching",
    Boolean(citations.length && refs.length),
    withStageBudget((attemptDeadline) =>
      matchCitationsToReferences(citations, refs, attemptDeadline)
    )
  );
  const styleStage = await runStage(
    "style",
    Boolean(bodyText),
    withStageBudget((attemptDeadline) =>
      checkStyle(bodyText, citationStyle, citations, refs, attemptDeadline)
    )
  );
  const verification = await verificationPromise;
  const matches = matchStage.value ?? [];
  const styleWarnings = styleStage.value ?? [];
  // A failed matching stage yields no matches; that must not be read as "no
  // citation matches anything".
  const matchingChecked = matchStage.value !== null;

  const citationResults = buildCitationResults(citations, matches, matchingChecked);
  const refResults = buildReferenceResults(
    refs,
    citationResults,
    verification.crossrefResults,
    verification.openalexResults,
    verification.openlibraryResults,
    verification.retractionResults,
    matchingChecked
  );

  const attempted = checks.filter((c) => c.status !== "skipped");
  const failed = checks.filter(
    (c) =>
      c.status === "unavailable" ||
      (c.status === "skipped" && c.reason === "budget")
  );

  // Everything that could run failed and no verification or parsed content
  // exists: surface the first real provider error so the client can show an
  // actionable retry path instead of an empty "clean" audit.
  const coreErrors = [citationsStage, refsStage, claimsStage, styleStage]
    .map((s) => s.error)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  const hasUsableOutput =
    citations.length > 0 ||
    refs.length > 0 ||
    uncitedClaims.length > 0 ||
    styleWarnings.length > 0 ||
    verification.unavailableCount < refs.length;
  if (
    coreErrors.length > 0 &&
    attempted.length > 0 &&
    attempted.every((c) => c.status === "unavailable") &&
    !hasUsableOutput
  ) {
    throw coreErrors[0];
  }

  return {
    citations: citationResults,
    references: refResults,
    matches,
    style_warnings: styleWarnings,
    uncited_claims: uncitedClaims,
    recency: calculatePublicationRecency(refResults),
    status: failed.length > 0 ? "partial" : "completed",
    checks,
  };
}

function buildCitationResults(
  citations: CitationEntry[],
  matches: MatchEntry[],
  matchingChecked: boolean
): JsonObject[] {
  const matchListByText = new Map<string, MatchEntry[]>();
  for (const m of matches) {
    const key = normalizeKey(m.citation_raw_text || "");
    if (key) {
      const list = matchListByText.get(key) || [];
      list.push(m);
      matchListByText.set(key, list);
    }
  }

  return citations.map((c) => {
    const key = normalizeKey(c.raw_text || "");
    const candidates = matchListByText.get(key) || [];
    const match: MatchEntry | undefined = candidates[0];

    const rawIdx = match?.matched_reference_index;
    let matchedRefIdx: number | null = null;
    if (rawIdx !== null && rawIdx !== undefined) {
      const parsed = parseInt(String(rawIdx).trim(), 10);
      matchedRefIdx = Number.isNaN(parsed) ? null : parsed;
    }

    return {
      raw_text: c.raw_text || "",
      paragraph_index: c.paragraph_index ?? 0,
      char_start: c.char_start ?? 0,
      char_end: c.char_end ?? 0,
      context: c.context || "",
      extracted_authors: c.extracted_authors || [],
      extracted_year: c.extracted_year ?? null,
      citation_type: c.citation_type || "parenthetical",
      // "no_match" is a claim: the citation is not in the reference list. Only
      // make it when the matching check actually ran; otherwise the citation is
      // unchecked, not unmatched.
      status:
        matchedRefIdx !== null
          ? "matched"
          : matchingChecked
            ? "no_match"
            : "unchecked",
      confidence: match?.confidence ?? 0,
      matched_reference_index: matchedRefIdx,
      match_type: match?.match_type || "none",
      issues: match?.issues || [],
    };
  });
}

async function verifyReferences(
  refs: ReferenceEntry[],
  deadline: number
): Promise<{
  crossrefResults: JsonObject[];
  openalexResults: JsonObject[];
  openlibraryResults: JsonObject[];
  retractionResults: JsonObject[];
  unavailableCount: number;
}> {
  const unavailable = (provider: string, error: unknown): JsonObject => {
    const kind = String((error as { kind?: unknown })?.kind || "provider_error");
    const reason =
      kind === "budget_exhausted"
        ? "the analysis time budget ran out"
        : "the provider request failed";
    return {
      status: "verification_unavailable",
      provider,
      message: `${provider} verification could not complete: ${reason}. This reference is unverified, not confirmed correct.`,
      how_to_fix:
        kind === "budget_exhausted"
          ? "Re-run the audit on a shorter reference list so every entry can be verified, or check this reference manually."
          : "Retry the audit. If the provider stays unavailable, check this reference manually.",
    };
  };

  const outOfTime = (provider: string): JsonObject => ({
    status: "verification_unavailable",
    provider,
    message: `${provider} verification was skipped because the analysis time budget ran out. This reference is unverified, not confirmed correct.`,
    how_to_fix:
      "Re-run the audit on a shorter reference list so every entry can be verified, or check these references manually.",
  });

  const expired = (): boolean => Date.now() >= deadline;
  // Reference lists can be long; unbounded fan-out both trips provider rate
  // limits and burns the function's time budget waiting on the slowest tail.
  const limit = Math.max(1, aiConfig.verifyConcurrency);
  // Crossref rate-limits bursts (HTTP 429), so its fan-out stays lower than
  // the shared limit while OpenAlex and retraction checks keep the higher one.
  const crossrefLimit = Math.max(1, Math.min(limit, 3));

  const crossrefSettled = await mapWithConcurrency(refs, crossrefLimit, (r) =>
    expired() ? Promise.resolve(outOfTime("Crossref")) : validateReferenceWithCrossref(r)
  );
  const crossrefResults: JsonObject[] = crossrefSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("Crossref", r.reason)
  );

  const openalexSettled = await mapWithConcurrency(refs, limit, (r, i) => {
    const cr = crossrefResults[i];
    if (expired()) return Promise.resolve(outOfTime("OpenAlex"));
    if (!cr["crossref_verified"] && (r.parsed_doi || r.parsed_title)) {
      return validateReferenceWithOpenalex(r);
    }
    // Crossref already produced the authoritative record; OpenAlex is a
    // fallback, not a second opinion. State that explicitly instead of
    // returning an empty object that reads like a verified result.
    return Promise.resolve({
      status: "not_consulted",
      provider: "openalex",
      message: "Crossref already verified this reference, so OpenAlex was not consulted.",
      discrepancies: [],
    });
  });
  const openalexResults: JsonObject[] = openalexSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("OpenAlex", r.reason)
  );

  const openlibrarySettled = await mapWithConcurrency(refs, limit, (r, i) => {
    const cr = crossrefResults[i];
    const oa = openalexResults[i];
    if (expired()) return Promise.resolve(outOfTime("OpenLibrary"));
    const alreadyVerified = Boolean(cr["crossref_verified"] || oa["verified"]);
    if (!alreadyVerified && r.parsed_title) {
      return validateReferenceWithOpenLibrary(r);
    }
    return Promise.resolve({
      status: "not_consulted",
      provider: "openlibrary",
      message: alreadyVerified
        ? "Reference was already verified by Crossref or OpenAlex."
        : "No title was available to query OpenLibrary.",
      discrepancies: [],
    });
  });
  const openlibraryResults: JsonObject[] = openlibrarySettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("OpenLibrary", r.reason)
  );

  const retractionSettled = await mapWithConcurrency(refs, limit, (r, i) => {
    if (expired()) return Promise.resolve(outOfTime("Retraction check"));
    return checkRetractionStatus(
      r.parsed_doi,
      r.parsed_title,
      (crossrefResults[i]["raw_work"] as JsonObject | undefined) || null
    );
  });
  const retractionResults: JsonObject[] = retractionSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("Retraction check", r.reason)
  );

  const unavailableCount = refs.filter((_, i) =>
    [crossrefResults[i], openalexResults[i], openlibraryResults[i], retractionResults[i]].some(
      (r) => r["status"] === "verification_unavailable"
    )
  ).length;

  return {
    crossrefResults,
    openalexResults,
    openlibraryResults,
    retractionResults,
    unavailableCount,
  };
}

function buildReferenceResults(
  refs: ReferenceEntry[],
  citationResults: JsonObject[],
  crossrefResults: JsonObject[],
  openalexResults: JsonObject[],
  openlibraryResults: JsonObject[],
  retractionResults: JsonObject[],
  matchingChecked: boolean
): JsonObject[] {
  const matchedIndices = new Set<number>();
  for (const cr of citationResults) {
    const idx = cr["matched_reference_index"];
    if (typeof idx === "number") matchedIndices.add(idx);
  }

  return refs.map((r, i) => {
    const crVal = crossrefResults[i] || {};
    const oaVal = openalexResults[i] || {};
    const olVal = openlibraryResults[i] || {};
    const retVal = retractionResults[i] || {};

    const cleanCrVal: JsonObject = {};
    for (const [k, v] of Object.entries(crVal)) {
      if (k !== "raw_work") cleanCrVal[k] = v;
    }

    if (!cleanCrVal["crossref_verified"] && oaVal["verified"]) {
      cleanCrVal["crossref_verified"] = true;
      cleanCrVal["provider"] = "openalex";
      // The fallback's own outcome replaces Crossref's `not_found`; otherwise a
      // reference OpenAlex did verify is still counted and shown as unverified.
      cleanCrVal["status"] = oaVal["status"] || "verified";
      cleanCrVal["message"] =
        cleanCrVal["status"] === "verified"
          ? "Verified with OpenAlex because Crossref has no record for this reference."
          : "OpenAlex records different metadata for this reference.";
      cleanCrVal["how_to_fix"] = null;
      cleanCrVal["canonical_title"] = oaVal["canonical_title"];
      cleanCrVal["canonical_doi"] = oaVal["canonical_doi"];
      cleanCrVal["canonical_year"] = oaVal["canonical_year"];
      cleanCrVal["canonical_venue"] = oaVal["canonical_venue"];
      cleanCrVal["discrepancies"] = oaVal["discrepancies"] || [];
    }

    if (!cleanCrVal["crossref_verified"] && olVal["verified"]) {
      cleanCrVal["crossref_verified"] = true;
      cleanCrVal["provider"] = "openlibrary";
      cleanCrVal["canonical_title"] = olVal["canonical_title"];
      cleanCrVal["canonical_isbn"] = olVal["canonical_isbn"];
      cleanCrVal["discrepancies"] = olVal["discrepancies"] || [];
      cleanCrVal["status"] = olVal["status"] || "verified";
      cleanCrVal["message"] = "Verified with Open Library because Crossref has no record for this reference.";
      cleanCrVal["how_to_fix"] = null;
    }

    // "orphaned" means no in-text citation exists. It may only be reported when
    // the matching check ran; otherwise the reference is unchecked.
    let status = matchedIndices.has(i)
      ? "cited"
      : matchingChecked
        ? "orphaned"
        : "unchecked";
    if (retVal["is_retracted"] || oaVal["is_retracted"]) status = "retracted";

    return {
      raw_entry: r.raw_entry || "",
      position: r.position ?? i + 1,
      parsed_authors: r.parsed_authors || [],
      parsed_year: r.parsed_year ?? null,
      parsed_title: r.parsed_title ?? null,
      parsed_journal: r.parsed_journal ?? null,
      parsed_volume: r.parsed_volume ?? null,
      parsed_issue: r.parsed_issue ?? null,
      parsed_pages: r.parsed_pages ?? null,
      parsed_doi: r.parsed_doi ?? null,
      parsed_url: r.parsed_url ?? null,
      reference_type: r.reference_type || "unknown",
      status,
      crossref_validation: cleanCrVal,
      openalex_validation: oaVal,
      openlibrary_validation: olVal,
      retraction_info: retVal,
    };
  });
}
