import asyncio
import json
import logging
import re
from typing import Dict, List

from ..models.schemas import (
    CitationsResponseSchema,
    MatchesResponseSchema,
    ReferencesResponseSchema,
    StyleWarningsResponseSchema,
)
from .llm import async_call_gemini, parse_and_validate_ai_response

logger = logging.getLogger(__name__)

CITATION_EXTRACTION_SYSTEM_PROMPT = """You are an expert academic citation parser. Your task is to extract ALL in-text citations from academic text with high precision.

═══════════════════════════════════════════════════════
STEP 1 — CONTEXT-AWARE DOCUMENT ANALYSIS
═══════════════════════════════════════════════════════
Read the document content and identify in-text citation markers (APA, MLA, Harvard, Vancouver, Chicago, IEEE, etc.) used within body paragraphs.

═══════════════════════════════════════════════════════
STEP 2 — EXTRACTION & DISCRIMINATION RULES
═══════════════════════════════════════════════════════
1. Extract parenthetical citations like (Author, Year), (Author & Author, Year)
2. Extract narrative citations like Author (Year) or Author et al. (Year)
3. Extract numeric citations like [1], [2,3], [1-3] and superscript numbers
4. Extract footnote markers
5. DO NOT flag generic year references like "the 2020 pandemic" or "in 2007" as citations
6. DO NOT flag section headings, chapter titles, figure captions, or Table of Contents items as in-text citations
7. Return the exact raw text of each citation found
8. Preserve the exact paragraph_index given in the input payload, character start/end, surrounding context (±100 chars), type, author surnames, and year."""


async def _extract_citations_single_batch(paragraphs_batch: List[Dict], citation_style: str) -> List[Dict]:
    payload = json.dumps(paragraphs_batch, ensure_ascii=False)
    prompt = f"""Analyze the following document paragraphs and extract all in-text citations.

Citation style: {citation_style}

Document paragraphs:
{payload}

Return a JSON object with this structure:
{{
  "citations": [
    {{
      "raw_text": "the exact citation text as it appears",
      "paragraph_index": 0,
      "char_start": 0,
      "char_end": 0,
      "context": "surrounding text ±100 chars",
      "extracted_authors": ["AuthorSurname"],
      "extracted_year": 2024,
      "citation_type": "parenthetical|narrative|numeric|footnote"
    }}
  ]
}}"""

    raw = await async_call_gemini(
        prompt,
        system_instruction=CITATION_EXTRACTION_SYSTEM_PROMPT,
        response_schema=CitationsResponseSchema
    )
    logger.debug("AI RAW RESPONSE [CITATIONS EXTRACTION BATCH]: %s", raw)

    validated = parse_and_validate_ai_response(raw, CitationsResponseSchema)
    return [item.model_dump() for item in validated.citations]


async def extract_citations(text: str, citation_style: str) -> List[Dict]:
    """
    Extracts in-text citations with intelligent paragraph chunking to support long manuscripts
    without token truncation or data loss.
    """
    paragraphs = text.split("\n\n")
    doc_structure = []
    for i, para in enumerate(paragraphs):
        p_str = para.strip()
        if p_str:
            doc_structure.append({"paragraph_index": i, "text": p_str[:3000]})

    if not doc_structure:
        return []

    # If small to medium manuscript, process in a single call
    if len(doc_structure) <= 30:
        return await _extract_citations_single_batch(doc_structure, citation_style)

    # For larger manuscripts, chunk with a 2-paragraph overlap to prevent splitting citations across batch boundaries
    chunk_size = 25
    overlap = 2
    step = chunk_size - overlap
    batches = []

    for start_idx in range(0, len(doc_structure), step):
        batch = doc_structure[start_idx : start_idx + chunk_size]
        if batch:
            batches.append(batch)
        if start_idx + chunk_size >= len(doc_structure):
            break

    tasks = [_extract_citations_single_batch(batch, citation_style) for batch in batches]
    batch_results = await asyncio.gather(*tasks, return_exceptions=True)

    all_citations = []
    seen = set()

    for res in batch_results:
        if isinstance(res, Exception):
            logger.error(f"Error in citation extraction batch: {res}")
            continue
        for c in res:
            p_idx = c.get("paragraph_index", 0)
            raw = re.sub(r"\s+", " ", c.get("raw_text", "").strip().lower())
            key = (p_idx, raw)
            if key not in seen and raw:
                seen.add(key)
                all_citations.append(c)

    all_citations.sort(key=lambda x: (x.get("paragraph_index", 0), x.get("char_start", 0)))
    return all_citations


REFERENCE_PARSING_SYSTEM_PROMPT = """You are an expert academic document parser and bibliographic classifier based on Formatly's multi-step document architecture.

═══════════════════════════════════════════════════════
STEP 1 — UNDERSTAND DOCUMENT STRUCTURE BEFORE PARSING
═══════════════════════════════════════════════════════
Before assigning or extracting any reference entry, analyze the input text and build an internal model of:
• The overall document structure (Title Page, Table of Contents, List of Figures/Tables, Abstract, Body Chapters, References).
• Non-reference sections vs actual Bibliography / Reference List sections.
• Author's structural markers (e.g. "Figure 1:", "Table 1:", "Chapter 1:", "Reclaiming the Body...").

═══════════════════════════════════════════════════════
STEP 2 — STRICT CLASSIFICATION & NEGATIVE DISCRIMINATION
═══════════════════════════════════════════════════════
Only extract items that are TRUE EXTERNAL REFERENCE LIST / BIBLIOGRAPHY ENTRIES (published papers, books, journal articles, reports, theses, websites).

ABSOLUTE EXCLUSIONS — DO NOT EXTRACT THE FOLLOWING AS REFERENCES UNDER ANY CIRCUMSTANCES:
1. Table of Contents lines & Section Titles (e.g. "Chapter 1: Embodied Teaching...", "Organization of Dissertation...", "Historical Roots of Embodied Pedagogy...", "Reclaiming the Body in Education...", "Humanistic Foundations...", "Transpersonal Education...").
2. Figure Captions and Table Titles (e.g. "Figure 1: Conceptual Framework...", "Table 2: Participant Demographics...").
3. Narrative Body Paragraphs, positionality statements, interview transcripts, or methodology excerpts that happen to discuss literature in running sentences.
4. Header/Footer artifacts, page numbers, or university administrative frontmatter."""


async def _parse_references_single_batch(chunk_text: str, starting_pos: int = 1) -> List[Dict]:
    schema_example = json.dumps({
        "references": [{
            "raw_entry": "Smith, J. (2020). Example title. Journal of Testing, 15(3), 112-128. https://doi.org/10.1000/xyz123",
            "position": starting_pos,
            "parsed_authors": [{"family": "Smith", "given": "J."}],
            "parsed_year": 2020,
            "parsed_title": "Example title",
            "parsed_journal": "Journal of Testing",
            "parsed_volume": "15",
            "parsed_issue": "3",
            "parsed_pages": "112-128",
            "parsed_doi": "10.1000/xyz123",
            "parsed_url": None,
            "reference_type": "journal_article",
        }],
    }, indent=2)

    prompt = f"""Identify and parse ONLY actual published reference list entries from the text below into structured metadata. Completely skip and ignore all Table of Contents lines, figure captions, table titles, chapter headings, and narrative body paragraphs.

Reference text:
{chunk_text}

Return a JSON object with this structure:
{schema_example}"""

    raw = await async_call_gemini(
        prompt,
        system_instruction=REFERENCE_PARSING_SYSTEM_PROMPT,
        response_schema=ReferencesResponseSchema
    )
    logger.debug("AI RAW RESPONSE [REFERENCES PARSING BATCH]: %s", raw)

    validated = parse_and_validate_ai_response(raw, ReferencesResponseSchema)
    return [item.model_dump() for item in validated.references]


async def parse_references(reference_text: str) -> List[Dict]:
    """
    Parses bibliography / reference list into structured metadata with chunking for large lists.
    """
    if not reference_text or not reference_text.strip():
        return []

    clean_text = reference_text.strip()
    if len(clean_text) <= 30000:
        return await _parse_references_single_batch(clean_text, 1)

    # Split large reference lists into chunks of ~25,000 characters
    lines = clean_text.split("\n")
    chunks = []
    curr = []
    curr_len = 0
    for line in lines:
        curr.append(line)
        curr_len += len(line) + 1
        if curr_len >= 20000:
            chunks.append("\n".join(curr))
            curr = []
            curr_len = 0
    if curr:
        chunks.append("\n".join(curr))

    tasks = [_parse_references_single_batch(c, 1) for c in chunks]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_refs = []
    seen = set()
    pos = 1

    for res in results:
        if isinstance(res, Exception):
            logger.error(f"Error parsing reference chunk: {res}")
            continue
        for r in res:
            raw_entry = re.sub(r"\s+", " ", r.get("raw_entry", "").strip())
            if raw_entry and raw_entry.lower() not in seen:
                seen.add(raw_entry.lower())
                r["position"] = pos
                pos += 1
                all_refs.append(r)

    return all_refs


MATCHING_SYSTEM_PROMPT = """You are an expert citation matching system. Match in-text citations to reference list entries and determine the match quality.

Rules:
- Exact match: author surname(s) + year match perfectly
- Fuzzy match: minor spelling variations (e.g. Smyth vs Smith) or year discrepancies (e.g. 2019 in text vs 2020 in reference list)
- AI-verified: complex cases like corporate authors, translated works
- No match: citation that cannot be matched to any reference
- Explicitly flag spelling_mismatch or year_mismatch in issues list if detected
- Provide confidence score 0.0-1.0"""


async def match_citations_to_references(
    citations: List[Dict],
    references: List[Dict],
) -> List[Dict]:
    if not citations or not references:
        return []

    schema_example = json.dumps({
        "matches": [{
            "citation_raw_text": "the exact citation text",
            "matched_reference_index": 0,
            "matched_reference_text": "the matched reference entry",
            "match_type": "exact|fuzzy|ai_verified|none",
            "confidence": 0.95,
            "author_score": 1.0,
            "year_score": 1.0,
            "issues": [{"type": "spelling_mismatch|year_mismatch|style_warning", "code": "SPELLING_MISMATCH", "message": "Author spelling mismatch detected", "severity": "warning"}],
        }],
    }, indent=2)

    prompt = f"""Match the following in-text citations to reference list entries.

Citations:
{json.dumps(citations, indent=2, ensure_ascii=False)[:40000]}

References:
{json.dumps(references, indent=2, ensure_ascii=False)[:40000]}

For each citation, determine:
1. Which reference it matches by 0-based array index (0 for first reference, 1 for second reference, null if no match)
2. The match type: exact, fuzzy, ai_verified, or none
3. Confidence score 0.0-1.0
4. Detect any author spelling mismatches or year mismatches between citation and reference

Return a JSON object:
{schema_example}"""

    raw = await async_call_gemini(
        prompt,
        system_instruction=MATCHING_SYSTEM_PROMPT,
        response_schema=MatchesResponseSchema
    )
    logger.debug("AI RAW RESPONSE [CITATIONS & REFERENCES MATCHING]: %s", raw)

    validated = parse_and_validate_ai_response(raw, MatchesResponseSchema)
    return [item.model_dump() for item in validated.matches]


STYLE_CHECK_SYSTEM_PROMPT = """You are an expert citation style checker based on Formatly's multi-step document architecture. Analyze citations and references for compliance with the specified citation style manual.

Rules & Guidelines:
1. ONLY check actual in-text citations and reference list entries. Completely ignore Table of Contents lines, figure captions, table titles, section headings, and narrative body text.
2. Check for:
   - Missing commas between author and year in parenthetical citations (e.g. (Smith 2020) -> (Smith, 2020))
   - Missing commas before page numbers or missing 'p.'/'pp.' indicators (e.g. (Smith, 2020 45) -> (Smith, 2020, p. 45))
   - Incorrect use of & vs and in narrative vs parenthetical citations
   - Incorrect et al. usage
   - Missing DOIs for journal articles (APA 7)
   - Title capitalization issues
   - Incorrect page range formatting
3. For every style issue flagged, you MUST include the exact `target_text` (the in-text citation or reference string) where the violation occurs."""


async def check_style(
    text: str,
    citation_style: str,
    citations: List[Dict],
    references: List[Dict],
) -> List[Dict]:
    schema_example = json.dumps({
        "style_warnings": [{
            "code": "MISSING_COMMA_OR_PAGE_INDICATOR",
            "category": "formatting",
            "target_text": "(Smith 2020 45)",
            "message": "Missing comma between year and page number, or missing 'p.'/'pp.' indicator.",
            "suggestion": "Change to (Smith, 2020, p. 45)",
            "severity": "warning",
        }],
    }, indent=2)

    prompt = f"""Analyze the document text, citations, and reference list for compliance with the {citation_style} style manual.

Document text sample:
{text[:20000]}

Citations:
{json.dumps(citations, indent=2, ensure_ascii=False)[:20000]}

References:
{json.dumps(references, indent=2, ensure_ascii=False)[:20000]}

For every style issue found, include the exact target_text (the citation or reference entry string) where the issue occurs.

Return a JSON object:
{schema_example}"""

    raw = await async_call_gemini(
        prompt,
        system_instruction=STYLE_CHECK_SYSTEM_PROMPT,
        response_schema=StyleWarningsResponseSchema
    )
    logger.debug("AI RAW RESPONSE [STYLE CHECKING]: %s", raw)

    validated = parse_and_validate_ai_response(raw, StyleWarningsResponseSchema)
    return [item.model_dump() for item in validated.style_warnings]
