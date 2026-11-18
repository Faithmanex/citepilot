import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalysisPipeline } from "../pipeline";
import { extractCitations, matchCitationsToReferences } from "../citation-extractor";
import { validateReferenceWithCrossref } from "../crossref";
import { validateReferenceWithOpenalex } from "../openalex";
import { validateReferenceWithOpenLibrary } from "../openlibrary";
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
vi.mock("../openlibrary", () => ({ validateReferenceWithOpenLibrary: vi.fn() }));
vi.mock("../retraction", () => ({ checkRetractionStatus: vi.fn() }));

describe("verification completeness", () => {
  beforeEach(() => {
    vi.mocked(validateReferenceWithCrossref).mockReset().mockResolvedValue({ crossref_verified: true });
    vi.mocked(validateReferenceWithOpenalex).mockReset().mockResolvedValue({ verified: true });
    vi.mocked(validateReferenceWithOpenLibrary).mockReset().mockResolvedValue({ status: "not_found" });
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
    // One of two references could not be checked: the stage ran, so it is
    // `partial` — not `unavailable`, which would say the whole check failed.
    expect(result.checks.find(c => c.name === "verification")?.status).toBe("partial");
    expect(result.checks.find(c => c.name === "verification")?.message).toContain(
      "1 of 2 references"
    );
  });

  it("reports unavailable only when no reference could be verified", async () => {
    vi.mocked(validateReferenceWithCrossref).mockRejectedValue(new Error("offline"));
    vi.mocked(validateReferenceWithOpenalex).mockRejectedValue(new Error("offline"));

    const result = await runAnalysisPipeline("Body", "References", [], "apa7");

    const verification = result.checks.find((c) => c.name === "verification");
    expect(verification?.status).toBe("unavailable");
    expect(verification?.message).toContain("unverified, not confirmed correct");
    expect(result.status).toBe("partial");
  });
  it("reports completed when every required check succeeds", async () => {
    const result = await runAnalysisPipeline("Body", "References", [], "apa7");
    expect(result.status).toBe("completed");
  });

  it("uses the fallback provider's verdict instead of reporting not_found", async () => {
    // Crossref has no record for a book, OpenAlex does. The reference must count
    // as verified; otherwise the PDF totals it as unverified and the editor
    // tells the author it was not found.
    vi.mocked(validateReferenceWithCrossref).mockResolvedValue({
      crossref_verified: false,
      status: "not_found",
      message:
        "Reference metadata could not be found in the Crossref database.",
    });
    vi.mocked(validateReferenceWithOpenalex).mockResolvedValue({
      verified: true,
      status: "verified",
      provider: "openalex",
      canonical_title: "Pattern Recognition and Machine Learning",
      canonical_year: 2006,
      discrepancies: [],
    });

    const result = await runAnalysisPipeline("Body", "References", [], "apa7");

    for (const r of result.references) {
      const validation = r["crossref_validation"] as Record<string, unknown>;
      expect(validation["status"]).toBe("verified");
      expect(validation["provider"]).toBe("openalex");
      expect(String(validation["message"])).not.toContain(
        "could not be found in the Crossref database"
      );
    }
  });

  it("keeps the fallback provider's discrepancies and states the provider", async () => {
    vi.mocked(validateReferenceWithCrossref).mockResolvedValue({
      crossref_verified: false,
      status: "not_found",
    });
    vi.mocked(validateReferenceWithOpenalex).mockResolvedValue({
      verified: true,
      status: "discrepancies_found",
      provider: "openalex",
      discrepancies: [
        { field: "title", message: "Title discrepancy detected." },
      ],
    });

    const result = await runAnalysisPipeline("Body", "References", [], "apa7");

    for (const r of result.references) {
      const validation = r["crossref_validation"] as Record<string, unknown>;
      expect(validation["status"]).toBe("discrepancies_found");
      expect(validation["provider"]).toBe("openalex");
      expect(validation["discrepancies"]).toHaveLength(1);
    }
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
