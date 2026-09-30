/**
 * Shared document-analysis orchestration.
 * Port of `citepilot-ai/src/citepilot_ai/services/analysis_pipeline.py`.
 */
import {
  checkStyle,
  extractCitations,
  matchCitationsToReferences,
  parseReferences,
} from "./citation-extractor";
import { validateReferenceWithCrossref } from "./crossref";
import { validateReferenceWithOpenalex } from "./openalex";
import { detectUncitedClaims } from "./uncited-claims";
import { enrichMatchesWithJev, isJevEnabled } from "./jev";
import { calculatePublicationRecency } from "./recency";
import { checkRetractionStatus } from "./retraction";
import type {
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
}

export async function runAnalysisPipeline(
  bodyText: string,
  refText: string,
  paraMeta: ParagraphMeta[],
  citationStyle: string
): Promise<PipelineResult> {
  const settled = await Promise.allSettled([
    bodyText ? extractCitations(bodyText, citationStyle) : Promise.resolve([]),
    refText ? parseReferences(refText) : Promise.resolve([]),
    bodyText ? detectUncitedClaims(bodyText, paraMeta) : Promise.resolve([]),
  ]);

  const firstRejection = settled.find((r) => r.status === "rejected");
  if (firstRejection && firstRejection.status === "rejected") {
    throw firstRejection.reason;
  }

  const citations = settled[0].status === "fulfilled" ? settled[0].value : [];
  const refs = settled[1].status === "fulfilled" ? settled[1].value : [];
  const uncitedClaims = settled[2].status === "fulfilled" ? settled[2].value : [];

  let matches: MatchEntry[] =
    citations.length && refs.length
      ? await matchCitationsToReferences(citations, refs)
      : [];

  if (matches.length && isJevEnabled()) {
    matches = await enrichMatchesWithJev(matches);
  }

  const styleWarnings = bodyText
    ? await checkStyle(bodyText, citationStyle, citations, refs)
    : [];

  const citationResults = buildCitationResults(citations, matches);
  const { crossrefResults, openalexResults, retractionResults } =
    await verifyReferences(refs);
  const refResults = buildReferenceResults(
    refs,
    citationResults,
    crossrefResults,
    openalexResults,
    retractionResults
  );

  return {
    citations: citationResults,
    references: refResults,
    matches,
    style_warnings: styleWarnings,
    uncited_claims: uncitedClaims,
    recency: calculatePublicationRecency(refResults),
  };
}

function buildCitationResults(
  citations: CitationEntry[],
  matches: MatchEntry[]
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
      status: matchedRefIdx !== null ? "matched" : "no_match",
      confidence: match?.confidence ?? 0,
      matched_reference_index: matchedRefIdx,
      match_type: match?.match_type || "none",
      issues: match?.issues || [],
      jev_verdict: match?.jev_verdict ?? null,
      jev_choice: match?.jev_choice ?? null,
      jev_confidence: match?.jev_confidence ?? null,
      jev_auto: match?.jev_auto ?? null,
    };
  });
}

async function verifyReferences(refs: ReferenceEntry[]): Promise<{
  crossrefResults: JsonObject[];
  openalexResults: JsonObject[];
  retractionResults: JsonObject[];
}> {
  const unavailable = (provider: string, error: unknown): JsonObject => ({
    status: "verification_unavailable",
    provider,
    message: `${provider} verification failed: ${(error as Error).message}`,
  });

  const crossrefSettled = await Promise.allSettled(
    refs.map((r) => validateReferenceWithCrossref(r))
  );
  const crossrefResults = crossrefSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("Crossref", r.reason)
  );

  const openalexSettled = await Promise.allSettled(
    refs.map((r, i) => {
      const cr = crossrefResults[i];
      if (!cr["crossref_verified"] && (r.parsed_doi || r.parsed_title)) {
        return validateReferenceWithOpenalex(r);
      }
      return Promise.resolve({});
    })
  );
  const openalexResults = openalexSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("OpenAlex", r.reason)
  );

  const retractionSettled = await Promise.allSettled(
    refs.map((r, i) =>
      checkRetractionStatus(
        r.parsed_doi,
        r.parsed_title,
        (crossrefResults[i]["raw_work"] as JsonObject | undefined) || null
      )
    )
  );
  const retractionResults = retractionSettled.map((r) =>
    r.status === "fulfilled" ? r.value : unavailable("Retraction check", r.reason)
  );

  return { crossrefResults, openalexResults, retractionResults };
}

function buildReferenceResults(
  refs: ReferenceEntry[],
  citationResults: JsonObject[],
  crossrefResults: JsonObject[],
  openalexResults: JsonObject[],
  retractionResults: JsonObject[]
): JsonObject[] {
  const matchedIndices = new Set<number>();
  for (const cr of citationResults) {
    const idx = cr["matched_reference_index"];
    if (typeof idx === "number") matchedIndices.add(idx);
  }

  return refs.map((r, i) => {
    const crVal = crossrefResults[i] || {};
    const oaVal = openalexResults[i] || {};
    const retVal = retractionResults[i] || {};

    const cleanCrVal: JsonObject = {};
    for (const [k, v] of Object.entries(crVal)) {
      if (k !== "raw_work") cleanCrVal[k] = v;
    }

    if (!cleanCrVal["crossref_verified"] && oaVal["verified"]) {
      cleanCrVal["crossref_verified"] = true;
      cleanCrVal["provider"] = "openalex";
      cleanCrVal["canonical_title"] = oaVal["canonical_title"];
      cleanCrVal["canonical_doi"] = oaVal["canonical_doi"];
      cleanCrVal["discrepancies"] = oaVal["discrepancies"] || [];
    }

    let status = matchedIndices.has(i) ? "cited" : "orphaned";
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
      retraction_info: retVal,
    };
  });
}
