/**
 * OpenAlex metadata verification (multi-provider fallback).
 *
 * OpenAlex is queried only when Crossref could not verify a reference, so it
 * must perform the same field comparisons — otherwise a reference that Crossref
 * lacks would be marked verified on a title match alone, even with a wrong
 * journal, volume, or page range.
 */
import { getJson, HttpError } from "./http";
import {
  cleanDoi,
  journalsMatch,
  pagesMatch,
  titlesMatch,
  titlesRelated,
  volumesMatch,
} from "./crossref";
import type { JsonObject, ReferenceEntry } from "./types";

const OPENALEX_API_BASE = "https://api.openalex.org";

/**
 * OpenAlex record types that describe *another* work rather than being it.
 *
 * A book review carries the book's title but the review's own venue, volume and
 * pages, so using one to verify a book both misreports the canonical metadata
 * and manufactures false journal/volume/page discrepancies. Observed live for
 * Bishop 2006: `title.search` ranks the 2007 Kybernetes review above the book.
 */
const DERIVATIVE_TYPES = new Set([
  "book-review",
  "paratext",
  "erratum",
  "peer-review",
  "retraction",
  "supplementary-materials",
]);

export async function lookupOpenalexByDoi(
  doi: string
): Promise<JsonObject | null> {
  if (!doi) return null;
  try {
    const data = await getJson(
      `${OPENALEX_API_BASE}/works/https://doi.org/${encodeURIComponent(doi)}`
    );
    return data;
  } catch (error) {
    // 404 means OpenAlex has no record for this DOI, which is an answer, not an
    // outage. Callers fall back to a title search.
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Looks a work up by title.
 *
 * `filter=title.search` is used rather than the free-text `search` parameter:
 * for a known title, OpenAlex's free-text search ranks reviews and unrelated
 * works that merely mention the title above the work itself, so a real book
 * (for example Bishop 2006) came back as `not_found`. The title filter returns
 * the work, and `titlesRelated` still rejects a wrong subject.
 *
 * The author and year are deliberately not part of the query: both are under
 * review, so filtering on them would hide the very mismatch the audit reports.
 */
export async function lookupOpenalexByTitle(
  title: string | null | undefined
): Promise<JsonObject | null> {
  if (!title || title.trim().length < 5) return null;

  const params = new URLSearchParams({
    filter: `title.search:${title.trim()}`,
    per_page: "10",
  });

  const data = await getJson(`${OPENALEX_API_BASE}/works?${params.toString()}`);
  const results = data?.results as unknown[] | undefined;
  if (!Array.isArray(results)) return null;

  // OpenAlex search always returns candidates; only one whose title is the
  // reference's title may stand in for it, and never a record that merely
  // reviews or annotates the work.
  for (const result of results) {
    if (!result || typeof result !== "object") continue;
    const candidate = result as JsonObject;
    const candidateType =
      typeof candidate["type"] === "string" ? (candidate["type"] as string) : "";
    if (DERIVATIVE_TYPES.has(candidateType)) continue;
    const candidateTitle =
      typeof candidate["title"] === "string" ? (candidate["title"] as string) : "";
    if (candidateTitle && titlesRelated(title, candidateTitle)) return candidate;
  }
  return null;
}

export async function validateReferenceWithOpenalex(
  reference: ReferenceEntry
): Promise<JsonObject> {
  const doi = reference.parsed_doi || null;
  const title = reference.parsed_title || null;
  const year = reference.parsed_year ?? null;

  let work: JsonObject | null = null;
  try {
    if (doi) work = await lookupOpenalexByDoi(doi);
    if (!work && title) work = await lookupOpenalexByTitle(title);
  } catch (error) {
    return {
      verified: false,
      provider: "openalex",
      status: "verification_unavailable",
      message: `OpenAlex could not be reached to verify this reference: ${(error as Error).message}`,
      discrepancies: [],
    };
  }

  if (!work) {
    return { verified: false, provider: "openalex", status: "not_found", discrepancies: [] };
  }

  const canonicalTitle =
    typeof work["title"] === "string" ? (work["title"] as string) : "";
  const canonicalDoi =
    typeof work["doi"] === "string"
      ? (work["doi"] as string).replace("https://doi.org/", "")
      : "";
  const canonicalYear =
    typeof work["publication_year"] === "number"
      ? (work["publication_year"] as number)
      : null;
  const primaryLocation = work["primary_location"] as JsonObject | undefined;
  const source = primaryLocation?.["source"] as JsonObject | undefined;
  const canonicalVenue =
    typeof source?.["display_name"] === "string"
      ? (source["display_name"] as string)
      : null;
  const isRetracted =
    typeof work["is_retracted"] === "boolean" ? (work["is_retracted"] as boolean) : false;
  const biblio = work["biblio"] as JsonObject | undefined;
  const canonicalVolume =
    typeof biblio?.["volume"] === "string" ? (biblio["volume"] as string) : "";
  const firstPage =
    typeof biblio?.["first_page"] === "string" ? (biblio["first_page"] as string) : "";
  const lastPage =
    typeof biblio?.["last_page"] === "string" ? (biblio["last_page"] as string) : "";
  const canonicalPages = firstPage
    ? lastPage && lastPage !== firstPage
      ? `${firstPage}-${lastPage}`
      : firstPage
    : "";

  const discrepancies: JsonObject[] = [];

  if (title && canonicalTitle && !titlesMatch(title, canonicalTitle)) {
    discrepancies.push({
      field: "title",
      message: `Title discrepancy detected: OpenAlex records '${canonicalTitle}'.`,
      how_to_fix: `Update the article title in your reference entry to the official publisher title: '${canonicalTitle}'.`,
      severity: "warning",
    });
  }

  if (year && canonicalYear && Math.abs(Number(year) - canonicalYear) > 1) {
    discrepancies.push({
      field: "year",
      message: `Publication year mismatch: document states ${year}, OpenAlex records ${canonicalYear}.`,
      how_to_fix: `Change the year in your reference entry and in-text citation from '${year}' to '${canonicalYear}'.`,
      severity: "warning",
    });
  }

  if (doi && canonicalDoi && cleanDoi(doi).toLowerCase() !== canonicalDoi.toLowerCase()) {
    discrepancies.push({
      field: "doi",
      message: `DOI mismatch: Reference has '${doi}', but OpenAlex records '${canonicalDoi}'.`,
      how_to_fix: `Replace the DOI in your reference entry with 'https://doi.org/${canonicalDoi}'.`,
      severity: "error",
    });
  }

  const journal = reference.parsed_journal || "";
  if (journal && canonicalVenue && !journalsMatch(journal, canonicalVenue)) {
    discrepancies.push({
      field: "journal",
      message: `Journal mismatch: Reference lists '${journal}', but OpenAlex records '${canonicalVenue}'.`,
      how_to_fix: `Update the journal or container title in your reference entry to '${canonicalVenue}'.`,
      severity: "warning",
    });
  }

  const volume = reference.parsed_volume || "";
  if (volume && canonicalVolume && !volumesMatch(volume, canonicalVolume)) {
    discrepancies.push({
      field: "volume",
      message: `Volume mismatch: Reference lists '${volume}', but OpenAlex records '${canonicalVolume}'.`,
      how_to_fix: `Update the volume in your reference entry to '${canonicalVolume}'.`,
      severity: "warning",
    });
  }

  const pages = reference.parsed_pages || "";
  if (pages && canonicalPages && !pagesMatch(pages, canonicalPages)) {
    discrepancies.push({
      field: "pages",
      message: `Page range mismatch: Reference lists '${pages}', but OpenAlex records '${canonicalPages}'.`,
      how_to_fix: `Update the page range in your reference entry to '${canonicalPages}'.`,
      severity: "warning",
    });
  }

  return {
    verified: true,
    provider: "openalex",
    // Mirrors Crossref's contract: every provider result states its outcome.
    status: discrepancies.length === 0 ? "verified" : "discrepancies_found",
    canonical_title: canonicalTitle,
    canonical_doi: canonicalDoi,
    canonical_year: canonicalYear,
    canonical_venue: canonicalVenue,
    canonical_volume: canonicalVolume,
    canonical_pages: canonicalPages,
    is_retracted: isRetracted,
    openalex_id: work["id"],
    discrepancies,
  };
}
