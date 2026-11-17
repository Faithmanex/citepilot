/**
 * OpenLibrary book & monograph metadata verification (fallback provider).
 *
 * Consulted when Crossref and OpenAlex return `not_found` for books, textbooks,
 * and monographs that do not carry standard journal DOIs.
 */
import { getJson, HttpError } from "./http";
import { titlesRelated, namesMatch, titlesMatch } from "./crossref";
import type { JsonObject, ReferenceEntry } from "./types";

const OPENLIBRARY_API_BASE = "https://openlibrary.org";

/**
 * Searches OpenLibrary by title and optional author surname.
 */
export async function lookupOpenLibraryByTitleAndAuthor(
  title: string,
  author?: string
): Promise<JsonObject | null> {
  if (!title || title.trim().length < 4) return null;

  const cleanTitle = title.replace(/[^\w\s]/g, " ").trim();
  const cleanAuthor = (author || "").replace(/[^\w\s]/g, " ").trim();

  const params = new URLSearchParams({
    title: cleanTitle,
    limit: "5",
  });
  if (cleanAuthor) {
    params.set("author", cleanAuthor);
  }

  try {
    const data = await getJson(`${OPENLIBRARY_API_BASE}/search.json?${params.toString()}`);
    const docs = data?.docs as unknown[] | undefined;
    if (!Array.isArray(docs) || docs.length === 0) return null;

    for (const doc of docs) {
      if (!doc || typeof doc !== "object") continue;
      const candidate = doc as JsonObject;
      const candidateTitle = String(candidate["title"] || "");
      if (titlesRelated(title, candidateTitle)) return candidate;
    }
    return null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Validates a reference entry against OpenLibrary records.
 */
export async function validateReferenceWithOpenLibrary(
  reference: ReferenceEntry
): Promise<JsonObject> {
  const title = reference.parsed_title || null;
  const authors = reference.parsed_authors || [];
  const year = reference.parsed_year ?? null;
  const authorStr = String(authors[0]?.family || authors[0]?.given || "");

  if (!title) {
    return {
      verified: false,
      provider: "openlibrary",
      status: "not_found",
      discrepancies: [],
    };
  }

  let work: JsonObject | null = null;
  try {
    work = await lookupOpenLibraryByTitleAndAuthor(title, authorStr);
  } catch (error) {
    return {
      verified: false,
      provider: "openlibrary",
      status: "verification_unavailable",
      message: `OpenLibrary could not be reached to verify this reference: ${(error as Error).message}`,
      discrepancies: [],
    };
  }

  if (!work) {
    return {
      verified: false,
      provider: "openlibrary",
      status: "not_found",
      message: "Reference metadata could not be found in the OpenLibrary database.",
      discrepancies: [],
    };
  }

  const canonicalTitle = String(work["title"] || "");
  const canonicalYear =
    typeof work["first_publish_year"] === "number"
      ? work["first_publish_year"]
      : null;
  const authorNames = Array.isArray(work["author_name"])
    ? (work["author_name"] as string[])
    : [];
  const primaryAuthor = authorNames[0] || "";
  const isbns = Array.isArray(work["isbn"]) ? (work["isbn"] as string[]) : [];
  const canonicalIsbn = isbns[0] || null;
  const publishers = Array.isArray(work["publisher"])
    ? (work["publisher"] as string[])
    : [];
  const canonicalPublisher = publishers[0] || null;

  const discrepancies: JsonObject[] = [];

  if (title && canonicalTitle && !titlesMatch(title, canonicalTitle)) {
    discrepancies.push({
      field: "title",
      message: `Title discrepancy detected: OpenLibrary records '${canonicalTitle}'.`,
      how_to_fix: `Update the book title to match the official catalog record: '${canonicalTitle}'.`,
      severity: "warning",
    });
  }

  // Editions can vary by year; allow small window before flagging discrepancy
  if (year && canonicalYear && Math.abs(Number(year) - canonicalYear) > 2) {
    discrepancies.push({
      field: "year",
      message: `Publication year discrepancy: Reference lists '${year}', but OpenLibrary records initial publication in '${canonicalYear}'.`,
      how_to_fix: `Verify whether you are citing a later edition, or change publication year to '${canonicalYear}'.`,
      severity: "warning",
    });
  }

  if (authorStr && primaryAuthor && !namesMatch(authorStr, primaryAuthor)) {
    discrepancies.push({
      field: "author",
      message: `Author mismatch: Reference lists '${authorStr}', but OpenLibrary records '${primaryAuthor}'.`,
      how_to_fix: `Correct the primary author name in your reference entry to '${primaryAuthor}'.`,
      severity: "warning",
    });
  }

  return {
    verified: true,
    provider: "openlibrary",
    status: discrepancies.length === 0 ? "verified" : "discrepancies_found",
    canonical_title: canonicalTitle,
    canonical_year: canonicalYear,
    canonical_author: primaryAuthor,
    canonical_isbn: canonicalIsbn,
    canonical_publisher: canonicalPublisher,
    discrepancies,
  };
}
