import { describe, it, expect } from "vitest";
import { calculateRigorScore } from "../rigorScoring";
import { ACADEMIC_DRAFTS } from "../sampleDrafts";

describe("Citation Rigor Scoring Engine (rigorScoring)", () => {
  it("calculates baseline score correctly with zero resolved suggestions", () => {
    const litReview = ACADEMIC_DRAFTS["lit-review"];
    const metrics = calculateRigorScore(
      litReview.defaultSuggestions,
      [],
      [],
      litReview.baseScore
    );

    expect(metrics.overallScore).toBe(64);
    expect(metrics.totalCount).toBe(4);
    expect(metrics.unresolvedCount).toBe(4);
    expect(metrics.acceptedCount).toBe(0);
    expect(metrics.dismissedCount).toBe(0);
    expect(metrics.statusLabel).toBe("Needs Immediate Attention");
    expect(metrics.isOptimal).toBe(false);
  });

  it("strictly increases score monotonically as suggestions are accepted", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
    const base = 64;

    const res0 = calculateRigorScore(suggestions, [], [], base);
    const res1 = calculateRigorScore(suggestions, ["lit-1"], [], base);
    const res2 = calculateRigorScore(suggestions, ["lit-1", "lit-2"], [], base);
    const res3 = calculateRigorScore(suggestions, ["lit-1", "lit-2", "lit-3"], [], base);
    const res4 = calculateRigorScore(suggestions, ["lit-1", "lit-2", "lit-3", "lit-4"], [], base);

    expect(res1.overallScore).toBeGreaterThan(res0.overallScore);
    expect(res2.overallScore).toBeGreaterThan(res1.overallScore);
    expect(res3.overallScore).toBeGreaterThan(res2.overallScore);
    expect(res4.overallScore).toBe(100);
    expect(res4.statusLabel).toBe("Ready for Journal Submission");
    expect(res4.isOptimal).toBe(true);
  });

  it("awards partial credit for dismissed suggestions without exceeding accepted fix score", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
    const base = 64;

    const acceptedOne = calculateRigorScore(suggestions, ["lit-1"], [], base);
    const dismissedOne = calculateRigorScore(suggestions, [], ["lit-1"], base);

    expect(dismissedOne.overallScore).toBeGreaterThan(base);
    expect(dismissedOne.overallScore).toBeLessThan(acceptedOne.overallScore);
    expect(dismissedOne.unresolvedCount).toBe(3);
    expect(dismissedOne.dismissedCount).toBe(1);
  });

  it("correctly clamps overall score at 100% maximum and 0% minimum", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
    
    // High base score with many accepted
    const maxMetrics = calculateRigorScore(
      suggestions,
      ["lit-1", "lit-2", "lit-3", "lit-4", "extra-1"],
      [],
      95
    );
    expect(maxMetrics.overallScore).toBe(100);

    // Negative base score clamp
    const minMetrics = calculateRigorScore(suggestions, [], [], -20);
    expect(minMetrics.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("evaluates custom drafts with 0 flaws accurately based on word count", () => {
    // 0 flaws and > 15 words
    const optimalMetrics = calculateRigorScore([], [], [], 64, 25);
    expect(optimalMetrics.overallScore).toBe(98);
    expect(optimalMetrics.sourceCoverage).toBe(100);
    expect(optimalMetrics.claimIntegrity).toBe(100);
    expect(optimalMetrics.scholarlyTone).toBe(98);
    expect(optimalMetrics.statusLabel).toBe("Ready for Journal Submission");
    expect(optimalMetrics.isOptimal).toBe(true);

    // 0 flaws but low word count (< 15 words)
    const lowCountMetrics = calculateRigorScore([], [], [], 64, 5);
    expect(lowCountMetrics.overallScore).toBe(70);
    expect(lowCountMetrics.statusLabel).toBe("Needs Immediate Attention");
  });

  it("transitions status classifications accurately across score tiers", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;

    const needsAttention = calculateRigorScore(suggestions, [], [], 60);
    expect(needsAttention.statusLabel).toBe("Needs Immediate Attention");

    const moderate = calculateRigorScore(suggestions, ["lit-1", "lit-2"], [], 60);
    expect(moderate.statusLabel).toBe("Moderate Verification Needed");

    const strong = calculateRigorScore(suggestions, ["lit-1", "lit-2", "lit-3"], [], 60);
    expect(strong.statusLabel).toBe("Strong Academic Rigor");

    const ready = calculateRigorScore(suggestions, ["lit-1", "lit-2", "lit-3", "lit-4"], [], 60);
    expect(ready.statusLabel).toBe("Ready for Journal Submission");
  });

  it("calculates category-aware sub-metrics accurately", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
    // lit-1 is missing-citation, lit-2 is claim-needs-source, lit-3 is outdated-reference, lit-4 is tone-clarity

    const initialMetrics = calculateRigorScore(suggestions, [], [], 64);
    const resolvedMissing = calculateRigorScore(suggestions, ["lit-1"], [], 64);
    const resolvedClaims = calculateRigorScore(suggestions, ["lit-2"], [], 64);
    const resolvedTone = calculateRigorScore(suggestions, ["lit-4"], [], 64);

    expect(resolvedMissing.sourceCoverage).toBeGreaterThan(initialMetrics.sourceCoverage);
    expect(resolvedClaims.claimIntegrity).toBeGreaterThan(initialMetrics.claimIntegrity);
    expect(resolvedTone.scholarlyTone).toBeGreaterThan(initialMetrics.scholarlyTone);
  });
});
