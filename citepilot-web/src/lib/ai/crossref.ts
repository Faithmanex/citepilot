/**
 * Crossref metadata verification.
 * Port of `citepilot-ai/src/citepilot_ai/services/crossref_service.py`.
 */
import { getJson, HttpError } from "./http";
import type { JsonObject, ReferenceEntry } from "./types";

const CROSSREF_API_BASE = "https://api.crossref.org/works";

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "of", "on", "and", "for", "to", "with", "by",
  "at", "from", "is", "are", "was", "were", "or", "as", "that", "this",
]);

/** Normalizes a DOI string into its canonical `10.x/...` form. */
export function cleanDoi(doiStr: string | null | undefined): string {
  if (!doiStr) return "";
  let cleaned = doiStr.trim();
  cleaned = cleaned.replace(/^doi:\s*/i, "");
  cleaned = cleaned.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const match = cleaned.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/i);
  let result = match ? match[0] : cleaned;
  result = result.replace(/[\.,;)\]]+$/, "");
  return result;
}

export function fuzzyTitleMatch(t1: string, t2: string): boolean {
  const words1 = t1
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const words2 = t2
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const s1 = new Set(words1);
  const s2 = new Set(words2);
  if (s1.size === 0 || s2.size === 0) return false;
  let intersection = 0;
  for (const w of s1) if (s2.has(w)) intersection += 1;
  const smaller = Math.min(s1.size, s2.size);
  return intersection / smaller >= 0.75;
}

export async function fetchByDoi(doi: string): Promise<JsonObject | null> {
  const url = `${CROSSREF_API_BASE}/${encodeURIComponent(doi)}`;
  let data: Record<string, unknown>;
  try {
    data = await getJson(url);
  } catch (error) {
    // A 404 means the DOI does not resolve — a real "not found". Anything else
    // (timeout, 5xx) is an outage and must not be reported as "not found".
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
  const message = data.message;
  return message && typeof message === "object" ? (message as JsonObject) : null;
}

export async function searchByQuery(
  title: string,
  author: string
): Promise<JsonObject | null> {
  const cleanTitle = title.replace(/[^\w\s]/g, "").trim();
  const queryStr = `${cleanTitle} ${author}`.trim();
  const url = `${CROSSREF_API_BASE}?query.bibliographic=${encodeURIComponent(queryStr)}&rows=1`;
  const data = await getJson(url);
  const message = data.message as JsonObject | undefined;
  const items = message?.items as unknown[] | undefined;
  if (items && items.length > 0 && typeof items[0] === "object") {
    return items[0] as JsonObject;
  }
  return null;
}

function firstString(value: unknown): string {
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
}

export async function validateReferenceWithCrossref(
  refEntry: ReferenceEntry
): Promise<JsonObject> {
  const doi = refEntry.parsed_doi || null;
  const title = refEntry.parsed_title || null;
  const authors = refEntry.parsed_authors || [];
  const year = refEntry.parsed_year ?? null;

  let work: JsonObject | null = null;
  try {
    if (doi) {
      work = await fetchByDoi(cleanDoi(doi));
    }
    if (!work && title) {
      const authorStr =
        authors[0] && typeof authors[0] === "object"
          ? String(authors[0].family || "")
          : "";
      work = await searchByQuery(title, authorStr);
    }
  } catch (error) {
    return {
      crossref_verified: false,
      status: "verification_unavailable",
      message: `Crossref could not be reached to verify this reference: ${(error as Error).message}`,
      how_to_fix:
        "This reference was not verified because the Crossref service was unavailable. Re-run the audit to retry verification.",
      discrepancies: [],
    };
  }

  if (!work) {
    return {
      crossref_verified: false,
      status: "not_found",
      message: "Reference metadata could not be found in the Crossref database.",
      how_to_fix:
        "Verify that the author names, publication year, and article title are spelled correctly in your reference list, or search doi.org to locate the official DOI.",
      discrepancies: [],
    };
  }

  const crTitle = firstString(work["title"]);
  const crDoi = typeof work["DOI"] === "string" ? (work["DOI"] as string) : "";
  const crJournal = firstString(work["container-title"]);
  const crYear = extractCrossrefYear(work);

  const discrepancies: JsonObject[] = [];

  if (year && crYear) {
    if (Number(year) !== Number(crYear)) {
      discrepancies.push({
        field: "year",
        message: `Publication year mismatch: Reference lists '${year}', but Crossref records '${crYear}'.`,
        how_to_fix: `Change the year in your reference entry and in-text citation from '${year}' to '${crYear}'.`,
        severity: "warning",
      });
    }
  }

  if (title && crTitle && !fuzzyTitleMatch(title, crTitle)) {
    discrepancies.push({
      field: "title",
      message: `Title discrepancy detected: Crossref records '${crTitle}'.`,
      how_to_fix: `Update the article title in your reference entry to match the official publisher title: '${crTitle}'.`,
      severity: "warning",
    });
  }

  if (doi && crDoi && cleanDoi(doi).toLowerCase() !== crDoi.toLowerCase()) {
    discrepancies.push({
      field: "doi",
      message: `DOI mismatch: Reference has '${doi}', but Crossref records '${crDoi}'.`,
      how_to_fix: `Replace the DOI string in your reference list entry with the verified Crossref DOI: 'https://doi.org/${crDoi}'.`,
      severity: "error",
    });
  }

  return {
    crossref_verified: true,
    status: discrepancies.length === 0 ? "verified" : "discrepancies_found",
    crossref_doi: crDoi,
    crossref_title: crTitle,
    crossref_journal: crJournal,
    crossref_year: crYear,
    discrepancies,
    raw_work: work,
  };
}

function extractCrossrefYear(work: JsonObject): number | null {
  const pick = (key: string): number | null => {
    const node = work[key] as JsonObject | undefined;
    const dateParts = node?.["date-parts"] as unknown[] | undefined;
    const first = Array.isArray(dateParts) ? dateParts[0] : undefined;
    if (Array.isArray(first) && typeof first[0] === "number") return first[0];
    return null;
  };
  return pick("published-print") ?? pick("published-online");
}
