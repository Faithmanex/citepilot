/** Shared loose data shapes used across the ported AI services. */

export interface AuthorEntry {
  family?: string | null;
  given?: string | null;
  [key: string]: unknown;
}

export interface ReferenceEntry {
  raw_entry?: string;
  position?: number;
  parsed_authors?: AuthorEntry[];
  parsed_year?: number | null;
  parsed_title?: string | null;
  parsed_journal?: string | null;
  parsed_volume?: string | null;
  parsed_issue?: string | null;
  parsed_pages?: string | null;
  parsed_doi?: string | null;
  parsed_url?: string | null;
  reference_type?: string;
  [key: string]: unknown;
}

export interface CitationEntry {
  raw_text?: string;
  paragraph_index?: number;
  char_start?: number;
  char_end?: number;
  context?: string;
  extracted_authors?: string[];
  extracted_year?: number | null;
  citation_type?: string;
  [key: string]: unknown;
}

export interface MatchEntry {
  citation_raw_text?: string;
  matched_reference_index?: number | string | null;
  matched_reference_text?: string | null;
  match_type?: string;
  confidence?: number;
  author_score?: number | null;
  year_score?: number | null;
  issues?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ParagraphMeta {
  paragraph_index: number;
  text: string;
  style_name?: string;
  is_heading?: boolean;
  char_count?: number;
  page_number?: number;
}

export type JsonObject = Record<string, unknown>;
