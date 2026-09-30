import { describe, it, expect } from "vitest";
import { computeAuditStats, computeMatchRate } from "../auditStats";
import type { AuditResponse } from "../types";

describe("computeAuditStats", () => {
  it("returns empty stats for null data", () => {
    const stats = computeAuditStats(null);
    expect(stats).toEqual({
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
      matchRate: 0,
    });
  });

  it("aggregates all badge categories and match rate", () => {
    const data: AuditResponse = {
      citations: [
        { raw_text: "(A, 2020)", status: "matched" },
        {
          raw_text: "(B, 2021)",
          status: "no_match",
          issues: [{ type: "spelling_mismatch", code: "SPELLING_MISMATCH" }],
        },
        { raw_text: "(C, 2022)", status: "matched", match_type: "fuzzy" },
        { raw_text: "(D, 2023)", status: "matched" },
      ],
      references: [
        { raw_entry: "r1", status: "orphaned" },
        { raw_entry: "r2", status: "retracted" },
        {
          raw_entry: "r3",
          status: "cited",
          crossref_validation: {
            crossref_verified: true,
            discrepancies: [{ field: "year" }, { field: "title" }],
          },
        },
      ],
      style_warnings: [{ code: "A" }, { code: "B" }, { code: "C" }],
      uncited_claims: [{ claim_text: "x" }, { claim_text: "y" }],
    };

    const stats = computeAuditStats(data);
    expect(stats.missingRefs).toBe(1);
    expect(stats.uncitedRefs).toBe(1);
    expect(stats.retractedCount).toBe(1);
    expect(stats.crDiscrepancies).toBe(2);
    // no_match + orphaned + spelling + fuzzy-mismatch flagged as spelling
    expect(stats.spellingMismatches).toBe(2);
    expect(stats.matching).toBe(1 + 1 + 2);
    expect(stats.crossref).toBe(1 + 2);
    expect(stats.style).toBe(3);
    expect(stats.claims).toBe(2);
    expect(stats.matchedCount).toBe(3);
    expect(stats.matchRate).toBe(75);
  });

  it("counts year mismatch issues separately", () => {
    const data: AuditResponse = {
      citations: [
        {
          raw_text: "(E, 2019)",
          status: "no_match",
          issues: [{ type: "year_mismatch", code: "YEAR_MISMATCH" }],
        },
      ],
    };
    const stats = computeAuditStats(data);
    expect(stats.yearMismatches).toBe(1);
    // matching = missingRefs(1) + yearMismatches(1)
    expect(stats.matching).toBe(2);
  });

  it("reports a zero match rate when there are no citations (not a perfect score)", () => {
    const stats = computeAuditStats({ references: [] });
    expect(stats.matchRate).toBe(0);
    expect(stats.matchedCount).toBe(0);
  });
});

describe("computeMatchRate", () => {
  it("returns 0 for null or empty data", () => {
    expect(computeMatchRate(null)).toBe(0);
    expect(computeMatchRate({})).toBe(0);
  });

  it("returns the real matched-to-total ratio", () => {
    const data: AuditResponse = {
      citations: [
        { raw_text: "(A, 2020)", status: "matched" },
        { raw_text: "(B, 2021)", status: "no_match" },
      ],
    };
    expect(computeMatchRate(data)).toBe(50);
  });
});
