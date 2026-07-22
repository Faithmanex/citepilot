export type CitationStyle =
  | "apa7" | "apa6" | "mla9" | "chicago17"
  | "harvard" | "ieee" | "vancouver" | "turabian" | "oscola";

export type AuditMode = "full" | "reference_only";

export interface Citation {
  raw_text: string;
  paragraph_index?: number;
  status: "matched" | "no_match";
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
  status: "matched" | "orphaned" | "retracted";
  parsed_doi?: string;
  crossref_validation?: CrossrefValidation;
  retraction_info?: RetractionInfo;
}

export interface CrossrefValidation {
  crossref_verified: boolean;
  discrepancies?: CrossrefDiscrepancy[];
}

export interface CrossrefDiscrepancy {
  field?: string;
  message?: string;
  how_to_fix?: string;
}

export interface RetractionInfo {
  how_to_fix?: string;
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

export interface AuditResponse {
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

export interface PanelId {
  panel: string;
}
