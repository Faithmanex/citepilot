import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalysisPipeline } from "../pipeline";
import { extractCitations, matchCitationsToReferences } from "../citation-extractor";
import { validateReferenceWithCrossref } from "../crossref";
import { validateReferenceWithOpenalex } from "../openalex";
import { checkRetractionStatus } from "../retraction";

vi.mock("../citation-extractor", () => ({
  extractCitations: vi.fn().mockResolvedValue([]),
  parseReferences: vi.fn().mockResolvedValue([{ parsed_title: "One" }, { parsed_title: "Two" }]),
  matchCitationsToReferences: vi.fn().mockResolvedValue([]),
  checkStyle: vi.fn().mockResolvedValue([]),
}));
vi.mock("../uncited-claims", () => ({ detectUncitedClaims: vi.fn().mockResolvedValue([]) }));
vi.mock("../crossref", () => ({ validateReferenceWithCrossref: vi.fn() }));
vi.mock("../openalex", () => ({ validateReferenceWithOpenalex: vi.fn() }));
vi.mock("../retraction", () => ({ checkRetractionStatus: vi.fn() }));

describe("verification completeness", () => {
  beforeEach(() => {
    vi.mocked(validateReferenceWithCrossref).mockReset().mockResolvedValue({ crossref_verified: true });
    vi.mocked(validateReferenceWithOpenalex).mockReset().mockResolvedValue({ verified: true });
    vi.mocked(checkRetractionStatus).mockReset().mockResolvedValue({ is_retracted: false });
  });
  it.each(["crossref", "openalex", "retraction"])("reports partial when one %s check fails", async (provider) => {
    if (provider === "crossref") vi.mocked(validateReferenceWithCrossref).mockRejectedValueOnce(new Error("offline"));
    if (provider === "openalex") {
      vi.mocked(validateReferenceWithCrossref).mockResolvedValueOnce({ crossref_verified: false });
      vi.mocked(validateReferenceWithOpenalex).mockRejectedValueOnce(new Error("offline"));
    }
    if (provider === "retraction") vi.mocked(checkRetractionStatus).mockRejectedValueOnce(new Error("offline"));
    const result = await runAnalysisPipeline("Body", "References", [], "apa7");
    expect(result.status).toBe("partial");
    expect(result.checks.find(c => c.name === "verification")?.status).toBe("unavailable");
  });
  it("reports completed when every required check succeeds", async () => {
    const result = await runAnalysisPipeline("Body", "References", [], "apa7");
    expect(result.status).toBe("completed");
  });

  it("does not claim citations are unmatched or references orphaned when matching never ran", async () => {
    vi.mocked(extractCitations).mockResolvedValueOnce([
      { raw_text: "(Smith, 2020)" } as never,
    ]);
    vi.mocked(matchCitationsToReferences).mockRejectedValueOnce(
      new Error("provider stalled")
    );

    const result = await runAnalysisPipeline(
      "Citation integrity matters (Smith, 2020).",
      "References",
      [],
      "apa7"
    );

    expect(result.checks.find((c) => c.name === "matching")?.status).toBe(
      "unavailable"
    );
    // "orphaned"/"no_match" are findings. A check that did not run cannot
    // produce them, so every item is reported as unchecked instead.
    expect(result.references.map((r) => r["status"])).toEqual([
      "unchecked",
      "unchecked",
    ]);
    expect(result.citations.map((c) => c["status"])).toEqual(["unchecked"]);
    expect(result.status).toBe("partial");
  });
});
