import { describe, expect, it } from "vitest";
import { adaptAuditResponseToSuggestions } from "../suggestionAdapter";

const entry = "Bishop, C. M. (2006). Pattern recognition and machine learning. Springer.";
const manuscript = `Machine learning is widely used ${entry}\n`;

function adapt(reference: Record<string, unknown>) {
  return adaptAuditResponseToSuggestions(
    {
      status: "completed",
      citations: [],
      style_warnings: [],
      uncited_claims: [],
      references: [reference],
    } as never,
    manuscript
  ).filter((s) => s.category === "reference");
}

describe("reference findings from verification results", () => {
  it("does not accuse a clean reference of being retracted", () => {
    // Regression: the adapter tested for the presence of `retraction_info`,
    // which every reference carries, so every clean reference was reported as
    // "Retracted Academic Paper Detected".
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: { crossref_verified: true, status: "verified", discrepancies: [] },
      retraction_info: { is_retracted: false, status: "normal", message: null },
    });

    expect(suggestions).toEqual([]);
  });

  it("reports a real retraction with the notice guidance", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "retracted",
      crossref_validation: { crossref_verified: true, status: "verified" },
      retraction_info: {
        is_retracted: true,
        status: "retracted",
        message: "RETRACTED PAPER: This reference was formally retracted.",
        how_to_fix: "Remove this reference from your manuscript.",
      },
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].title).toBe("Retracted Academic Paper Detected");
    expect(suggestions[0].severity).toBe("high");
    expect(suggestions[0].educationalContext).toBe("Remove this reference from your manuscript.");
  });

  it("turns an unconfirmed check into an explicit action, not a clean result", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: { crossref_verified: true, status: "verified", discrepancies: [] },
      retraction_info: {
        is_retracted: false,
        status: "unknown",
        action_required: true,
        message:
          "No matching record was found in Crossref for this reference, so retraction status could not be confirmed. Retraction status is unconfirmed — this is not a finding that the paper was retracted.",
        how_to_fix:
          "Verify this source manually before submission: open the article's page on the publisher's site and check for a retraction notice; adding the DOI lets CitePilot run this check automatically.",
      },
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].title).toBe("Retraction status not confirmed");
    expect(suggestions[0].severity).toBe("medium");
    expect(suggestions[0].explanation).toContain("could not be confirmed");
    expect(suggestions[0].explanation).toContain("not a finding that the paper was retracted");
    expect(suggestions[0].educationalContext).toContain("Verify this source manually");
    expect(suggestions[0].metadata?.actionRequired).toBe(true);
  });

  it("does not report a reference verified by the fallback provider as not found", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: {
        crossref_verified: true,
        status: "verified",
        provider: "openalex",
        message: "Verified with OpenAlex because Crossref has no record for this reference.",
        discrepancies: [],
      },
      retraction_info: { is_retracted: false, status: "normal" },
    });

    expect(suggestions).toEqual([]);
  });

  it("names the provider that found a discrepancy", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: {
        crossref_verified: true,
        status: "discrepancies_found",
        provider: "openalex",
        discrepancies: [
          {
            field: "title",
            message: "Title discrepancy detected: OpenAlex records 'Pattern Recognition and Machine Learning'.",
            how_to_fix: "Update the title.",
          },
        ],
      },
      retraction_info: { is_retracted: false, status: "normal" },
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].title).toBe("Metadata Discrepancy Found in OpenAlex");
  });

  it("names a provider that could not verify a reference at all", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: {
        crossref_verified: false,
        status: "verification_unavailable",
        message: "Crossref verification could not complete: the provider request failed.",
        how_to_fix: "Retry the audit. If Crossref stays unavailable, check this reference manually.",
      },
      retraction_info: {
        is_retracted: false,
        status: "unknown",
        action_required: true,
        message: "Retraction status could not be confirmed.",
      },
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].title).toContain("Metadata verification not confirmed");
    expect(suggestions[0].explanation).toContain("Retraction status could not be confirmed");
    expect(suggestions[0].metadata?.actionRequired).toBe(true);
  });
  it("states which fallback provider could not be checked for a not-found reference", () => {
    const suggestions = adapt({
      raw_entry: entry,
      status: "cited",
      crossref_validation: {
        crossref_verified: false,
        status: "not_found",
        message: "Reference metadata could not be found in the Crossref database.",
        how_to_fix: "Verify the title, or search doi.org.",
      },
      openalex_validation: {
        provider: "openalex",
        status: "verification_unavailable",
        message: "OpenAlex rate-limited this lookup (HTTP 429).",
        how_to_fix:
          "Re-run the audit in a minute; if this reference still cannot be checked, verify it manually on the publisher's site or at doi.org.",
      },
      openlibrary_validation: {
        provider: "openlibrary",
        status: "not_found",
      },
      retraction_info: { is_retracted: false, status: "normal" },
    });

    expect(suggestions).toHaveLength(1);
    // The author must learn that "not found" is still an open question because
    // one provider never answered, not a final negative.
    expect(suggestions[0].explanation).toContain("OpenAlex could not be checked");
    expect(suggestions[0].educationalContext).toContain("Re-run the audit in a minute");
  });
});
