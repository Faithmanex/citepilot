/**
 * AI citation extraction, reference parsing, matching, and style checking.
 * Port of `citepilot-ai/src/citepilot_ai/services/citation_extractor.py`.
 */
import { callGemini, parseAndValidate } from "./llm";
import {
  CitationsResponseSchema,
  MatchesResponseSchema,
  ReferencesResponseSchema,
  StyleWarningsResponseSchema,
} from "./schemas";
import type { CitationEntry, JsonObject, MatchEntry, ReferenceEntry } from "./types";

const CITATION_EXTRACTION_SYSTEM_PROMPT = `You are an expert academic citation parser. Your task is to extract ALL in-text citations from academic text with high precision.

Extract parenthetical citations, narrative citations, numeric citations, and footnote markers. DO NOT flag generic year references, section headings, chapter titles, figure captions, or Table of Contents items. Return the exact raw text of each citation found, with paragraph_index, character start/end, ±100 char context, type, author surnames, and year.`;

async function extractCitationsSingleBatch(
  paragraphsBatch: Array<{ paragraph_index: number; text: string }>,
  citationStyle: string
): Promise<CitationEntry[]> {
  const payload = JSON.stringify(paragraphsBatch);
  const prompt = `Analyze the following document paragraphs and extract all in-text citations.

Citation style: ${citationStyle}

Document paragraphs:
${payload}

Return a JSON object with this structure:
{
  "citations": [
    {
      "raw_text": "the exact citation text as it appears",
      "paragraph_index": 0,
      "char_start": 0,
      "char_end": 0,
      "context": "surrounding text ±100 chars",
      "extracted_authors": ["AuthorSurname"],
      "extracted_year": 2024,
      "citation_type": "parenthetical|narrative|numeric|footnote"
    }
  ]
}`;

  const raw = await callGemini(prompt, CITATION_EXTRACTION_SYSTEM_PROMPT);
  const validated = parseAndValidate(raw, CitationsResponseSchema);
  return validated.citations as CitationEntry[];
}

export async function extractCitations(
  text: string,
  citationStyle: string
): Promise<CitationEntry[]> {
  const paragraphs = text.split("\n\n");
  const docStructure: Array<{ paragraph_index: number; text: string }> = [];
  paragraphs.forEach((para, i) => {
    const pStr = para.trim();
    if (pStr) docStructure.push({ paragraph_index: i, text: pStr.slice(0, 3000) });
  });

  if (docStructure.length === 0) return [];

  if (docStructure.length <= 30) {
    return extractCitationsSingleBatch(docStructure, citationStyle);
  }

  const chunkSize = 25;
  const overlap = 2;
  const step = chunkSize - overlap;
  const batches: Array<Array<{ paragraph_index: number; text: string }>> = [];

  for (let startIdx = 0; startIdx < docStructure.length; startIdx += step) {
    const batch = docStructure.slice(startIdx, startIdx + chunkSize);
    if (batch.length > 0) batches.push(batch);
    if (startIdx + chunkSize >= docStructure.length) break;
  }

  const results = await Promise.allSettled(
    batches.map((batch) => extractCitationsSingleBatch(batch, citationStyle))
  );

  const all: CitationEntry[] = [];
  const seen = new Set<string>();

  for (const res of results) {
    if (res.status === "rejected") continue;
    for (const c of res.value) {
      const pIdx = c.paragraph_index ?? 0;
      const raw = (c.raw_text || "").trim().toLowerCase().replace(/\s+/g, " ");
      const key = `${pIdx}|${raw}`;
      if (!seen.has(key) && raw) {
        seen.add(key);
        all.push(c);
      }
    }
  }

  all.sort(
    (a, b) =>
      (a.paragraph_index ?? 0) - (b.paragraph_index ?? 0) ||
      (a.char_start ?? 0) - (b.char_start ?? 0)
  );
  return all;
}

const REFERENCE_PARSING_SYSTEM_PROMPT = `You are an expert academic document parser and bibliographic classifier based on Formatly's multi-step document architecture.

Only extract items that are TRUE EXTERNAL REFERENCE LIST / BIBLIOGRAPHY ENTRIES (published papers, books, journal articles, reports, theses, websites).

ABSOLUTE EXCLUSIONS — DO NOT EXTRACT: Table of Contents lines & section titles, figure/table captions, narrative body paragraphs, or header/footer artifacts.`;

async function parseReferencesSingleBatch(
  chunkText: string,
  startingPos = 1
): Promise<ReferenceEntry[]> {
  const schemaExample = JSON.stringify(
    {
      references: [
        {
          raw_entry:
            "Smith, J. (2020). Example title. Journal of Testing, 15(3), 112-128. https://doi.org/10.1000/xyz123",
          position: startingPos,
          parsed_authors: [{ family: "Smith", given: "J." }],
          parsed_year: 2020,
          parsed_title: "Example title",
          parsed_journal: "Journal of Testing",
          parsed_volume: "15",
          parsed_issue: "3",
          parsed_pages: "112-128",
          parsed_doi: "10.1000/xyz123",
          parsed_url: null,
          reference_type: "journal_article",
        },
      ],
    },
    null,
    2
  );

  const prompt = `Identify and parse ONLY actual published reference list entries from the text below into structured metadata. Completely skip and ignore all Table of Contents lines, figure captions, table titles, chapter headings, and narrative body paragraphs.

Reference text:
${chunkText}

Return a JSON object with this structure:
${schemaExample}`;

  const raw = await callGemini(prompt, REFERENCE_PARSING_SYSTEM_PROMPT);
  const validated = parseAndValidate(raw, ReferencesResponseSchema);
  return validated.references as ReferenceEntry[];
}

export async function parseReferences(referenceText: string): Promise<ReferenceEntry[]> {
  if (!referenceText || !referenceText.trim()) return [];

  const cleanText = referenceText.trim();
  if (cleanText.length <= 30000) {
    return parseReferencesSingleBatch(cleanText, 1);
  }

  const lines = cleanText.split("\n");
  const chunks: string[] = [];
  let curr: string[] = [];
  let currLen = 0;
  for (const line of lines) {
    curr.push(line);
    currLen += line.length + 1;
    if (currLen >= 20000) {
      chunks.push(curr.join("\n"));
      curr = [];
      currLen = 0;
    }
  }
  if (curr.length > 0) chunks.push(curr.join("\n"));

  const results = await Promise.allSettled(
    chunks.map((c) => parseReferencesSingleBatch(c, 1))
  );

  const all: ReferenceEntry[] = [];
  const seen = new Set<string>();
  let pos = 1;

  for (const res of results) {
    if (res.status === "rejected") continue;
    for (const r of res.value) {
      const rawEntry = (r.raw_entry || "").trim().replace(/\s+/g, " ");
      if (rawEntry && !seen.has(rawEntry.toLowerCase())) {
        seen.add(rawEntry.toLowerCase());
        r.position = pos;
        pos += 1;
        all.push(r);
      }
    }
  }

  return all;
}

const MATCHING_SYSTEM_PROMPT = `You are an expert citation matching system. Match in-text citations to reference list entries and determine the match quality.

Rules:
- Exact match: author surname(s) + year match perfectly
- Fuzzy match: minor spelling variations or year discrepancies
- AI-verified: complex cases like corporate authors, translated works
- No match: citation that cannot be matched to any reference
- Explicitly flag spelling_mismatch or year_mismatch in issues list if detected
- Provide confidence score 0.0-1.0`;

export async function matchCitationsToReferences(
  citations: CitationEntry[],
  references: ReferenceEntry[]
): Promise<MatchEntry[]> {
  if (!citations.length || !references.length) return [];

  const schemaExample = JSON.stringify(
    {
      matches: [
        {
          citation_raw_text: "the exact citation text",
          matched_reference_index: 0,
          matched_reference_text: "the matched reference entry",
          match_type: "exact|fuzzy|ai_verified|none",
          confidence: 0.95,
          author_score: 1.0,
          year_score: 1.0,
          issues: [
            {
              type: "spelling_mismatch|year_mismatch|style_warning",
              code: "SPELLING_MISMATCH",
              message: "Author spelling mismatch detected",
              severity: "warning",
            },
          ],
        },
      ],
    },
    null,
    2
  );

  const prompt = `Match the following in-text citations to reference list entries.

Citations:
${JSON.stringify(citations, null, 2).slice(0, 40000)}

References:
${JSON.stringify(references, null, 2).slice(0, 40000)}

For each citation, determine:
1. Which reference it matches by 0-based array index (null if no match)
2. The match type: exact, fuzzy, ai_verified, or none
3. Confidence score 0.0-1.0
4. Detect any author spelling mismatches or year mismatches

Return a JSON object:
${schemaExample}`;

  const raw = await callGemini(prompt, MATCHING_SYSTEM_PROMPT);
  const validated = parseAndValidate(raw, MatchesResponseSchema);
  return validated.matches as MatchEntry[];
}

const STYLE_CHECK_SYSTEM_PROMPT = `You are an expert citation style checker based on Formatly's multi-step document architecture. Analyze citations and references for compliance with the specified citation style manual.

Rules & Guidelines:
1. ONLY check actual in-text citations and reference list entries. Ignore Table of Contents lines, figure captions, table titles, section headings, and narrative body text.
2. Check for missing commas, missing p./pp. indicators, & vs and usage, et al. usage, missing DOIs (APA 7), title capitalization, and page range formatting.
3. For every style issue flagged, include the exact target_text where the violation occurs.`;

export async function checkStyle(
  text: string,
  citationStyle: string,
  citations: CitationEntry[],
  references: ReferenceEntry[]
): Promise<JsonObject[]> {
  const schemaExample = JSON.stringify(
    {
      style_warnings: [
        {
          code: "MISSING_COMMA_OR_PAGE_INDICATOR",
          category: "formatting",
          target_text: "(Smith 2020 45)",
          message:
            "Missing comma between year and page number, or missing 'p.'/'pp.' indicator.",
          suggestion: "Change to (Smith, 2020, p. 45)",
          severity: "warning",
        },
      ],
    },
    null,
    2
  );

  const prompt = `Analyze the document text, citations, and reference list for compliance with the ${citationStyle} style manual.

Document text sample:
${text.slice(0, 20000)}

Citations:
${JSON.stringify(citations, null, 2).slice(0, 20000)}

References:
${JSON.stringify(references, null, 2).slice(0, 20000)}

For every style issue found, include the exact target_text where the issue occurs.

Return a JSON object:
${schemaExample}`;

  const raw = await callGemini(prompt, STYLE_CHECK_SYSTEM_PROMPT);
  const validated = parseAndValidate(raw, StyleWarningsResponseSchema);
  return validated.style_warnings as JsonObject[];
}
