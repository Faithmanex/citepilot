/**
 * Crossref metadata verification.
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

/** Normalized, stop-word-free tokens for title comparison. */
function titleTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !STOP_WORDS.has(w))
  );
}

/**
 * Decides whether a Crossref search hit is the work the reference describes.
 *
 * Crossref's bibliographic search always returns *something*, so accepting the
 * top hit would validate a fabricated reference against an unrelated paper.
 * A candidate qualifies only when its title is the same title (see
 * `titlesMatch`) or contains it as a complete subtitle-style extension.
 */
export function titlesRelated(a: string, b: string): boolean {
  if (titlesMatch(a, b)) return true;
  const s1 = titleTokens(a);
  const s2 = titleTokens(b);
  if (s1.size === 0 || s2.size === 0) return false;
  const [small, large] = s1.size <= s2.size ? [s1, s2] : [s2, s1];
  // A single shared word is too weak a signal; two or more is a title stem.
  if (small.size < 2) return false;
  for (const word of small) if (!large.has(word)) return false;
  return true;
}

/**
 * True when two titles are the same after case, punctuation, and stop-word
 * normalization. This is an exact comparison, not a similarity threshold: a
 * title either matches the record or it is reported as a discrepancy.
 */
export function titlesMatch(t1: string, t2: string): boolean {
  const s1 = titleTokens(t1);
  const s2 = titleTokens(t2);
  if (s1.size === 0 || s2.size === 0) return false;
  if (s1.size !== s2.size) return false;
  for (const word of s1) if (!s2.has(word)) return false;
  return true;
}

/**
 * Normalizes a personal or corporate name for comparison: case, accents,
 * punctuation, and spacing are irrelevant.
 */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function namesMatch(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  return Boolean(x && y && x === y);
}

/**
 * Journal names match when they are equal after normalization, or when one
 * contains the other (which covers common "Journal of X" / "Journal of X
 * (Online)" variants without treating an abbreviation as a mismatch signal
 * only when it is a prefix of the full title).
 */
export function journalsMatch(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return true;
  if (x === y) return true;
  return x.includes(y) || y.includes(x);
}

export function volumesMatch(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const x = normalize(a);
  const y = normalize(b);
  return !x || !y || x === y;
}

/**
 * Page ranges match when their digits match. Formatting ("436-44" vs
 * "436–444", "pp." prefixes) is ignored; an incomplete range is not equal to
 * the full range because the digit strings differ.
 */
export function pagesMatch(a: string, b: string): boolean {
  const digits = (value: string) => value.replace(/\D/g, "");
  const x = digits(a);
  const y = digits(b);
  if (!x || !y) {
    const alnum = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    return alnum(a) === alnum(b);
  }
  return x === y;
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
  const url = `${CROSSREF_API_BASE}?query.bibliographic=${encodeURIComponent(queryStr)}&rows=5`;
  const data = await getJson(url);
  const message = data.message as JsonObject | undefined;
  const items = message?.items as unknown[] | undefined;
  if (!Array.isArray(items)) return null;

  // Only a candidate whose title is the reference's title may stand in for it.
  // Otherwise a fabricated reference would inherit a stranger's metadata.
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as JsonObject;
    const candidateTitle = firstString(candidate["title"]);
    if (!candidateTitle) continue;
    if (titlesRelated(title, candidateTitle)) return candidate;
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

  if (title && crTitle && !titlesMatch(title, crTitle)) {
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

  const crAuthors = Array.isArray(work["author"]) ? (work["author"] as JsonObject[]) : [];
  const crFirstAuthor = String(
    (crAuthors[0]?.["family"] as string | undefined) ||
      (crAuthors[0]?.["name"] as string | undefined) ||
      ""
  );
  const refFirstAuthor = String(authors[0]?.family || authors[0]?.given || "");
  if (refFirstAuthor && crFirstAuthor && !namesMatch(refFirstAuthor, crFirstAuthor)) {
    discrepancies.push({
      field: "author",
      message: `Author mismatch: Reference lists '${refFirstAuthor}', but Crossref records '${crFirstAuthor}'.`,
      how_to_fix: `Correct the first author's surname in your reference entry to '${crFirstAuthor}'.`,
      severity: "warning",
    });
  }

  const journal = refEntry.parsed_journal || "";
  if (journal && crJournal && !journalsMatch(journal, crJournal)) {
    discrepancies.push({
      field: "journal",
      message: `Journal mismatch: Reference lists '${journal}', but Crossref records '${crJournal}'.`,
      how_to_fix: `Update the journal or container title in your reference entry to '${crJournal}'.`,
      severity: "warning",
    });
  }

  const crVolume = typeof work["volume"] === "string" ? (work["volume"] as string) : "";
  const volume = refEntry.parsed_volume || "";
  if (volume && crVolume && !volumesMatch(volume, crVolume)) {
    discrepancies.push({
      field: "volume",
      message: `Volume mismatch: Reference lists '${volume}', but Crossref records '${crVolume}'.`,
      how_to_fix: `Update the volume in your reference entry to '${crVolume}'.`,
      severity: "warning",
    });
  }

  const crPages = typeof work["page"] === "string" ? (work["page"] as string) : "";
  const pages = refEntry.parsed_pages || "";
  if (pages && crPages && !pagesMatch(pages, crPages)) {
    discrepancies.push({
      field: "pages",
      message: `Page range mismatch: Reference lists '${pages}', but Crossref records '${crPages}'.`,
      how_to_fix: `Update the page range in your reference entry to '${crPages}'.`,
      severity: "warning",
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
