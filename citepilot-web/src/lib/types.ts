/**
 * Canonical style keys, matching the server allowlist. `chicago17` is kept as a
 * legacy alias and normalized to `chicago-author-date` before any request.
 */
export type CitationStyle =
  | "apa7" | "apa6" | "mla9" | "chicago-author-date" | "chicago-notes"
  | "harvard" | "ieee" | "vancouver" | "turabian" | "oscola";

export const CITATION_STYLES: CitationStyle[] = [
  "apa7",
  "apa6",
  "mla9",
  "chicago-author-date",
  "chicago-notes",
  "harvard",
  "ieee",
  "vancouver",
  "turabian",
  "oscola",
];

export type AuditMode = "full" | "reference_only";

export interface Citation {
  raw_text: string;
  paragraph_index?: number;
  status: "matched" | "no_match" | "unchecked";
  matched_reference_index?: number | null;
  match_type?: "exact" | "fuzzy";
  issues?: CitationIssue[];
}

export interface CitationIssue {
  type?: string;
  code?: string;
  message?: string;
}

export interface Reference {
  raw_entry: string;
  status: "cited" | "orphaned" | "retracted" | "unchecked";
  parsed_doi?: string;
  crossref_validation?: CrossrefValidation;
  retraction_info?: RetractionInfo;
}

export interface CrossrefValidation {
  crossref_verified: boolean;
  /** Which provider produced this record: Crossref, or a fallback. */
  provider?: "crossref" | "openalex" | "openlibrary";
  status?: "verified" | "discrepancies_found" | "not_found" | "verification_unavailable";
  message?: string;
  how_to_fix?: string;
  discrepancies?: CrossrefDiscrepancy[];
}

export interface CrossrefDiscrepancy {
  field?: string;
  message?: string;
  how_to_fix?: string;
}

export interface RetractionInfo {
  is_retracted?: boolean;
  status?: "normal" | "retracted" | "expression_of_concern" | "unknown";
  severity?: string;
  /** True only when the author has to act: the check did not produce an answer. */
  action_required?: boolean;
  notice_doi?: string;
  message?: string | null;
  how_to_fix?: string | null;
}

export interface StyleWarning {
  code?: string;
  message?: string;
  target_text?: string;
  suggestion?: string;
  educational_context?: string;
}

export interface UncitedClaim {
  claim_text?: string;
  paragraph_index?: number;
  suggestion?: string;
  educational_context?: string;
}

export interface RecencyData {
  within_3_years_count?: number;
  within_5_years_percent?: number;
  within_10_years_percent?: number;
  older_than_10_years_percent?: number;
  average_source_age_years?: number;
  recency_compliance_status?: string;
}

export interface StructureIssue {
  status?: "error" | "warning" | "ok" | "err" | "warn";
  severity?: "high" | "medium" | "low";
  title?: string;
  rule?: string;
  category?: string;
  description?: string;
  message?: string;
  sub?: string;
  suggestion?: string;
  how_to_fix?: string;
}

export interface AnalysisCheck {
  name: string;
  label: string;
  status: "completed" | "unavailable" | "skipped";
  reason?: "not_applicable" | "budget";
  message?: string;
  duration_ms?: number;
}

export interface AuditResponse {
  request_id?: string;
  mode?: AuditMode;
  citation_style?: string;
  /** `partial` means at least one requested check could not complete. */
  status?: "completed" | "partial";
  checks?: AnalysisCheck[];
  elapsed_seconds?: number;
  citations?: Citation[];
  references?: Reference[];
  style_warnings?: StyleWarning[];
  uncited_claims?: UncitedClaim[];
  recency?: RecencyData;
  structure?: StructureIssue[];
  layout_issues?: StructureIssue[];
  document_structure?: StructureIssue[];
  text?: string;
  manuscript_text?: string;
}

export const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: "APA 7th",
  apa6: "APA 6th",
  mla9: "MLA 9th",
  "chicago-author-date": "Chicago Author-Date",
  "chicago-notes": "Chicago Notes",
  harvard: "Harvard",
  ieee: "IEEE",
  vancouver: "Vancouver",
  turabian: "Turabian",
  oscola: "OSCOLA",
};

/**
 * Maps legacy or historical style keys onto the canonical set so reloading an
 * old saved audit cannot send an invalid style to the API.
 */
export function normalizeCitationStyle(value: string | null | undefined): CitationStyle {
  const raw = String(value ?? "").trim().toLowerCase();
  const aliases: Record<string, CitationStyle> = {
    chicago17: "chicago-author-date",
    chicago: "chicago-author-date",
    mla: "mla9",
    apa: "apa7",
    "apa-7": "apa7",
    "apa-6": "apa6",
  };
  const candidate = (aliases[raw] || raw) as CitationStyle;
  return CITATION_STYLES.includes(candidate) ? candidate : "apa7";
}
