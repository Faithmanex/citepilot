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
    return { is_retracted: false, status: "normal", message: null, how_to_fix: null };
  }

  let work: JsonObject | null = crossrefWork || null;

  if (!work && doi) work = await fetchByDoi(cleanDoi(doi));
  if (!work && title) work = await searchByQuery(title, "");

  if (work) return analyzeCrossrefRetraction(work);

  return { is_retracted: false, status: "normal", message: null, how_to_fix: null };
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

  const titles = work["title"] as unknown[] | undefined;
  if (titles && titles.length > 0 && typeof titles[0] === "string") {
    const tLower = titles[0].toLowerCase().trim();
    if (
      ["retracted:", "retracted article:", "[retracted]", "retraction:"].some((p) =>
        tLower.startsWith(p)
      ) ||
      tLower.includes(" [retracted]")
    ) {
      return {
        is_retracted: true,
        status: "retracted",
        severity: "red",
        notice_doi: String(work["DOI"] || ""),
        message:
          "RETRACTED PAPER: Title is prefixed as Retracted Article in publisher metadata.",
        how_to_fix: "Remove this citation or replace it with a valid, non-retracted reference.",
      };
    }
  }

  return { is_retracted: false, status: "normal", message: null, how_to_fix: null };
}
