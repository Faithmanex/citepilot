/**
 * OpenAlex metadata verification (multi-provider fallback).
 * Port of `citepilot-ai/src/citepilot_ai/services/openalex_service.py`.
 */
import { getJson } from "./http";
import { cleanDoi } from "./crossref";
import type { JsonObject, ReferenceEntry } from "./types";

const OPENALEX_API_BASE = "https://api.openalex.org";

export async function lookupOpenalexByDoi(
  doi: string
): Promise<JsonObject | null> {
  if (!doi) return null;
  const data = await getJson(
    `${OPENALEX_API_BASE}/works/https://doi.org/${encodeURIComponent(doi)}`
  );
  return data;
}

export async function lookupOpenalexByTitleAuthor(
  title: string | null | undefined,
  author?: string | null,
  year?: number | null
): Promise<JsonObject | null> {
  if (!title || title.trim().length < 5) return null;

  let query = title.trim();
  if (author) query = `${query} ${author.trim()}`;

  const params = new URLSearchParams({ search: query, per_page: "3" });
  if (year) params.set("filter", `publication_year:${year}`);

  const data = await getJson(`${OPENALEX_API_BASE}/works?${params.toString()}`);
  const results = data?.results as unknown[] | undefined;
  if (results && results.length > 0 && typeof results[0] === "object") {
    return results[0] as JsonObject;
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

  void cleanDoi; // parity with Python imports; DOI cleaning handled upstream

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
