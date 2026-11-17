/**
 * Retraction / Expression-of-Concern detection via Crossref/Retraction Watch.
 */
import { cleanDoi, fetchByDoi, searchByQuery } from "./crossref";
import type { JsonObject } from "./types";

/**
 * What the author has to do when CitePilot could not confirm retraction status.
 *
 * This is the only honest answer: no provider record means the check did not
 * happen, so the author must look at the publisher's own record. It is stated
 * as an action because a reference whose retraction status is unknown cannot be
 * cleared by the audit, and submitting a retracted source is the author's risk.
 */
const UNCONFIRMED_ACTION =
  "Verify this source manually before submission: open the article's page on the publisher's site (or look up the DOI at doi.org) and check for a retraction or expression-of-concern notice; if the publisher page is unclear, search the title at retractionwatch.com. Adding the article DOI to the reference entry lets CitePilot run this check automatically on the next audit.";

const UNCONFIRMED_SEVERITY = "warning";

/** Shared shape for every "could not be confirmed" outcome. */
function unconfirmed(reason: string): JsonObject {
  return {
    is_retracted: false,
    status: "unknown",
    severity: UNCONFIRMED_SEVERITY,
    action_required: true,
    message: `${reason} Retraction status is unconfirmed — this is not a finding that the paper was retracted.`,
    how_to_fix: UNCONFIRMED_ACTION,
  };
}

export async function checkRetractionStatus(
  doi?: string | null,
  title?: string | null,
  crossrefWork?: JsonObject | null
): Promise<JsonObject> {
  if (!doi && !title && !crossrefWork) {
    return unconfirmed(
      "No DOI or title was available for this reference, so retraction status could not be checked."
    );
  }

  let work: JsonObject | null = crossrefWork || null;

  try {
    if (!work && doi) work = await fetchByDoi(cleanDoi(doi));
    if (!work && title) work = await searchByQuery(title, "");
  } catch (error) {
    return unconfirmed(
      `Retraction status could not be checked because the provider request failed: ${(error as Error).message}.`
    );
  }

  if (work) return analyzeCrossrefRetraction(work);

  return unconfirmed(
    "No matching record was found in Crossref for this reference, so retraction status could not be confirmed."
  );
}

export function analyzeCrossrefRetraction(work: JsonObject): JsonObject {
  if (!work || typeof work !== "object") {
    return { is_retracted: false, status: "normal", message: null, how_to_fix: null };
  }

  const relation = (work["relation"] as JsonObject | undefined) || {};
  const updateTo = (work["update-to"] as JsonObject[] | undefined) || [];
  const isRetractedBy = (relation["is-retracted-by"] as JsonObject[] | undefined) || [];

  if (isRetractedBy.length > 0) {
    const noticeDoi = String(isRetractedBy[0]?.id || "");
    return {
      is_retracted: true,
      status: "retracted",
      severity: "red",
      notice_doi: noticeDoi,
      message: `RETRACTED PAPER: This reference was formally retracted. Notice DOI: ${noticeDoi}`,
      how_to_fix:
        "Remove this reference from your manuscript or cite a non-retracted peer-reviewed study that supports your thesis.",
    };
  }

  for (const update of updateTo) {
    const label = String(update?.label || "").toLowerCase();
    const typeUp = String(update?.type || "").toLowerCase();
    if (
      label.includes("retraction") ||
      typeUp.includes("retraction") ||
      label.includes("withdrawn")
    ) {
      return {
        is_retracted: true,
        status: "retracted",
        severity: "red",
        notice_doi: String(update?.DOI || ""),
        message: `RETRACTED PAPER: Marked as retracted in Crossref records (${update?.label || "Retraction Notice"}).`,
        how_to_fix:
          "Remove this reference from your manuscript or cite an active non-retracted source.",
      };
    } else if (label.includes("concern")) {
      return {
        is_retracted: true,
        status: "expression_of_concern",
        severity: "orange",
        notice_doi: String(update?.DOI || ""),
        message:
          "EXPRESSION OF CONCERN: Publisher issued an Expression of Concern for this publication.",
        how_to_fix:
          "Inspect the publisher's Expression of Concern notice and qualify the claim in your text accordingly.",
      };
    }
  }

  // No retraction relation present. We deliberately do not guess from the title
  // text: only explicit Crossref retraction metadata is treated as a signal.
  return { is_retracted: false, status: "normal", message: null, how_to_fix: null };
}
