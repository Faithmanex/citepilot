import type { AuditResponse } from "./types";

export type AuditStats = {
  matching: number;
  crossref: number;
  style: number;
  claims: number;
  missingRefs: number;
  uncitedRefs: number;
  retractedCount: number;
  crDiscrepancies: number;
  spellingMismatches: number;
  yearMismatches: number;
  matchedCount: number;
  matchRate: number;
};

const EMPTY_STATS: AuditStats = {
  matching: 0,
  crossref: 0,
  style: 0,
  claims: 0,
  missingRefs: 0,
  uncitedRefs: 0,
  retractedCount: 0,
  crDiscrepancies: 0,
  spellingMismatches: 0,
  yearMismatches: 0,
  matchedCount: 0,
  matchRate: 100,
};

export function computeAuditStats(data: AuditResponse | null): AuditStats {
  if (!data) return EMPTY_STATS;

  const citations = data.citations ?? [];
  const refs = data.references ?? [];
  const warnings = data.style_warnings ?? [];
  const claims = data.uncited_claims ?? [];

  const missingRefs = citations.filter((c) => c.status === "no_match").length;
  const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
  const retractedCount = refs.filter((r) => r.status === "retracted").length;
  const crDiscrepancies = refs.reduce(
    (acc, r) => acc + (r.crossref_validation?.discrepancies?.length ?? 0),
    0
  );
  const spellingMismatches = citations.filter(
    (c) =>
      c.match_type === "fuzzy" ||
      (c.issues ?? []).some(
        (i) => i.type === "spelling_mismatch" || i.code === "SPELLING_MISMATCH"
      )
  ).length;
  const yearMismatches = citations.filter(
    (c) =>
      (c.issues ?? []).some(
        (i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH"
      )
  ).length;
  const matchedCount = citations.filter((c) => c.status === "matched").length;
  const matchRate = citations.length
    ? Math.round((matchedCount / citations.length) * 100)
    : 100;

  return {
    matching: missingRefs + uncitedRefs + spellingMismatches + yearMismatches,
    crossref: retractedCount + crDiscrepancies,
    style: warnings.length,
    claims: claims.length,
    missingRefs,
    uncitedRefs,
    retractedCount,
    crDiscrepancies,
    spellingMismatches,
    yearMismatches,
    matchedCount,
    matchRate,
  };
}

/**
 * Single integrity-score formula (0-100) used both by the Overview panel and the
 * auto-saved audit history, so the displayed score always matches what is stored.
 */
export function computeScore(data: AuditResponse | null): number {
  if (!data) return 100;

  const stats = computeAuditStats(data);
  const totalDeductions =
    stats.missingRefs * 12 +
    stats.uncitedRefs * 8 +
    stats.retractedCount * 25 +
    stats.crDiscrepancies * 5 +
    stats.style * 3 +
    stats.claims * 5;

  return Math.max(0, Math.min(100, 100 - totalDeductions));
}
