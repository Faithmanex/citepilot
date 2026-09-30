/**
 * Zod schemas mirroring `citepilot-ai/src/citepilot_ai/models/schemas.py`.
 *
 * The web client (`citepilot-web/src/lib/types.ts`) consumes the snake_case API
 * shapes, so these schemas deliberately keep Python field names.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* LLM response validation schemas                                    */
/* ------------------------------------------------------------------ */

export const ExtractedCitationItemSchema = z.object({
  raw_text: z.string().default(""),
  paragraph_index: z.number().int().default(0),
  char_start: z.number().int().default(0),
  char_end: z.number().int().default(0),
  context: z.string().default(""),
  extracted_authors: z.array(z.string()).default([]),
  extracted_year: z.number().int().nullable().default(null),
  citation_type: z.string().default("parenthetical"),
});
export type ExtractedCitationItem = z.infer<typeof ExtractedCitationItemSchema>;

export const CitationsResponseSchema = z.object({
  citations: z.array(ExtractedCitationItemSchema).default([]),
});

export const ParsedAuthorItemSchema = z.object({
  family: z.string().nullable().default(null),
  given: z.string().nullable().default(null),
});
export type ParsedAuthorItem = z.infer<typeof ParsedAuthorItemSchema>;

export const ParsedReferenceItemSchema = z.object({
  raw_entry: z.string().default(""),
  position: z.number().int().default(1),
  parsed_authors: z.array(ParsedAuthorItemSchema).default([]),
  parsed_year: z.number().int().nullable().default(null),
  parsed_title: z.string().nullable().default(null),
  parsed_journal: z.string().nullable().default(null),
  parsed_volume: z.string().nullable().default(null),
  parsed_issue: z.string().nullable().default(null),
  parsed_pages: z.string().nullable().default(null),
  parsed_doi: z.string().nullable().default(null),
  parsed_url: z.string().nullable().default(null),
  reference_type: z.string().default("unknown"),
});
export type ParsedReferenceItem = z.infer<typeof ParsedReferenceItemSchema>;

export const ReferencesResponseSchema = z.object({
  references: z.array(ParsedReferenceItemSchema).default([]),
});

export const CitationMatchIssueSchema = z.object({
  type: z.string().nullable().default(null),
  code: z.string().nullable().default(null),
  message: z.string().nullable().default(null),
  severity: z.string().default("warning"),
});
export type CitationMatchIssue = z.infer<typeof CitationMatchIssueSchema>;

export const CitationMatchItemSchema = z.object({
  citation_raw_text: z.string().default(""),
  matched_reference_index: z
    .union([z.number(), z.string()])
    .nullable()
    .default(null),
  matched_reference_text: z.string().nullable().default(null),
  match_type: z.string().default("none"),
  confidence: z.number().default(0),
  author_score: z.number().nullable().default(null),
  year_score: z.number().nullable().default(null),
  issues: z.array(CitationMatchIssueSchema).default([]),
});
export type CitationMatchItem = z.infer<typeof CitationMatchItemSchema>;

export const MatchesResponseSchema = z.object({
  matches: z.array(CitationMatchItemSchema).default([]),
});

export const StyleWarningItemSchema = z.object({
  code: z.string().default("STYLE_WARNING"),
  category: z.string().default("formatting"),
  target_text: z.string().default(""),
  message: z.string().default(""),
  suggestion: z.string().nullable().default(null),
  severity: z.string().default("warning"),
});
export type StyleWarningItem = z.infer<typeof StyleWarningItemSchema>;

export const StyleWarningsResponseSchema = z.object({
  style_warnings: z.array(StyleWarningItemSchema).default([]),
});

export const UncitedClaimItemSchema = z.object({
  paragraph_index: z.number().int().default(0),
  claim_text: z.string().default(""),
  reason: z.string().default(""),
  severity: z.string().default("warning"),
});
export type UncitedClaimItem = z.infer<typeof UncitedClaimItemSchema>;

export const UncitedClaimsResponseSchema = z.object({
  uncited_claims: z.array(UncitedClaimItemSchema).default([]),
});

/* ------------------------------------------------------------------ */
/* API payload request schemas                                        */
/* ------------------------------------------------------------------ */

export const PdfExportRequestSchema = z
  .object({
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const DocxExportRequestSchema = z
  .object({
    text: z.string().default(""),
    analysis_data: z.record(z.string(), z.unknown()).default({}),
    mode: z.string().default("redline"),
  })
  .passthrough();

export type PdfExportRequest = z.infer<typeof PdfExportRequestSchema>;
export type DocxExportRequest = z.infer<typeof DocxExportRequestSchema>;
