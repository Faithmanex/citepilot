/**
 * Retraction / Expression-of-Concern detection via Crossref/Retraction Watch.
 * Port of `citepilot-ai/src/citepilot_ai/services/retraction_service.py`.
 */
import { cleanDoi, fetchByDoi, searchByQuery } from "./crossref";
import type { JsonObject } from "./types";

export async function checkRetractionStatus(
  doi?: string | null,
  title?: string | null,
  crossrefWork?: JsonObject | null
): Promise<JsonObject> {
  if (!doi && !title && !crossrefWork) {
    return {
      is_retracted: false,
      status: "unknown",
      message: "No DOI or title was available, so retraction status could not be checked.",
      how_to_fix: null,
    };
  }

  let work: JsonObject | null = crossrefWork || null;

  try {
    if (!work && doi) work = await fetchByDoi(cleanDoi(doi));
    if (!work && title) work = await searchByQuery(title, "");
  } catch (error) {
    return {
      is_retracted: false,
      status: "unknown",
      message: `Retraction status could not be checked: ${(error as Error).message}`,
      how_to_fix: null,
    };
  }

  if (work) return analyzeCrossrefRetraction(work);

  return {
    is_retracted: false,
    status: "unknown",
    message:
      "No matching record was found in Crossref, so retraction status could not be confirmed.",
    how_to_fix: null,
  };
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
