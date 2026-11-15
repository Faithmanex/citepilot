/**
 * OpenAlex metadata verification (multi-provider fallback).
 */
import { getJson, HttpError } from "./http";
import { titlesRelated } from "./crossref";
import type { JsonObject, ReferenceEntry } from "./types";

const OPENALEX_API_BASE = "https://api.openalex.org";

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

export async function lookupOpenalexByTitleAuthor(
  title: string | null | undefined,
  author?: string | null,
  year?: number | null
): Promise<JsonObject | null> {
  if (!title || title.trim().length < 5) return null;

  let query = title.trim();
  if (author) query = `${query} ${author.trim()}`;

  const params = new URLSearchParams({ search: query, per_page: "5" });
  if (year) params.set("filter", `publication_year:${year}`);

  const data = await getJson(`${OPENALEX_API_BASE}/works?${params.toString()}`);
  const results = data?.results as unknown[] | undefined;
  if (!Array.isArray(results)) return null;

  // OpenAlex search always returns candidates; only one whose title is the
  // reference's title may stand in for it.
  for (const result of results) {
    if (!result || typeof result !== "object") continue;
    const candidate = result as JsonObject;
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
  const authors = reference.parsed_authors || [];
  const year = reference.parsed_year ?? null;

  let authorFamily: string | null = null;
  if (authors.length > 0) {
    const first = authors[0];
    if (typeof first === "object" && first !== null) {
      authorFamily = (first.family as string) || null;
    }
  }

  let work: JsonObject | null = null;
  try {
    if (doi) work = await lookupOpenalexByDoi(doi);
    if (!work && title) {
      work = await lookupOpenalexByTitleAuthor(title, authorFamily, year);
    }
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

  const discrepancies: JsonObject[] = [];
  if (year && canonicalYear && Math.abs(Number(year) - canonicalYear) > 1) {
    discrepancies.push({
      field: "year",
      message: `Publication year mismatch: document states ${year}, OpenAlex records ${canonicalYear}.`,
      how_to_fix: `Change citation year to ${canonicalYear}.`,
    });
  }

  return {
    verified: true,
    provider: "openalex",
    canonical_title: canonicalTitle,
    canonical_doi: canonicalDoi,
    canonical_year: canonicalYear,
    canonical_venue: canonicalVenue,
    is_retracted: isRetracted,
    openalex_id: work["id"],
    discrepancies,
  };
}
