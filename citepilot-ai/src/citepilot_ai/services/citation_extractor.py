import json
import logging
from typing import Optional

from .llm import async_call_gemini, extract_json

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
8. Note paragraph index (0-based), character start/end, surrounding context (±100 chars), type, author surnames, and year."""


async def extract_citations(text: str, citation_style: str) -> list[dict]:
    paragraphs = text.split("\n\n")
    doc_structure = []
    for i, para in enumerate(paragraphs):
        if para.strip():
            doc_structure.append({"index": i, "text": para.strip()[:2000]})

    truncated = json.dumps(doc_structure, ensure_ascii=False)
    if len(truncated) > 120000:
        truncated = truncated[:120000] + "...[TRUNCATED]"

    prompt = f"""Analyze the following document text and extract all in-text citations.

Citation style: {citation_style}

Document paragraphs:
{truncated}

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

    raw = await async_call_gemini(prompt, system_instruction=CITATION_EXTRACTION_SYSTEM_PROMPT)
    logger.debug("AI RAW RESPONSE [CITATIONS EXTRACTION]: %s", raw)

    result = extract_json(raw)
    return result.get("citations", [])


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
2. Figure Captions & Table Titles (e.g. "Figure 1: An integrative framework...", "Figure 2: Integrating Lived...", "Table 1: Participant Characteristics...", "Table 2: Emergent Themes...").
3. Narrative Body Paragraphs & Autobiographical Positionality (e.g. "I grew up in India...", "In 2007, I delved into...", "This dissertation is structured across...", "My research investigates...", "The connection between embodied practices...").
4. Abstract text, Dedications, Acknowledgments, or Page headers.

═══════════════════════════════════════════════════════
STEP 3 — REQUIRED METADATA FIELDS
═══════════════════════════════════════════════════════
A valid reference entry MUST represent a published external source and contain formal bibliographic metadata (authors + year + title + journal/publisher/source/DOI). If a paragraph does not represent a published external work, omit it entirely."""


async def parse_references(reference_text: str) -> list[dict]:
    schema_example = json.dumps({
        "references": [{
            "raw_entry": "full reference entry as it appears",
            "position": 1,
            "parsed_authors": [{"family": "Smith", "given": "A. B."}],
            "parsed_year": 2024,
            "parsed_title": "Article title",
            "parsed_journal": "Journal Name",
            "parsed_volume": "15",
            "parsed_issue": "3",
            "parsed_pages": "112-128",
            "parsed_doi": "10.1000/xyz123",
            "parsed_url": None,
            "reference_type": "journal_article",
        }],
    }, indent=2)

    prompt_ref_text = reference_text[:80000] if len(reference_text) > 80000 else reference_text

    prompt = f"""Identify and parse ONLY actual published reference list entries from the text below into structured metadata. Completely skip and ignore all Table of Contents lines, figure captions, table titles, chapter headings, and narrative body paragraphs.

Reference text:
{prompt_ref_text}

Return a JSON object with this structure:
{schema_example}"""

    raw = await async_call_gemini(prompt, system_instruction=REFERENCE_PARSING_SYSTEM_PROMPT)
    logger.debug("AI RAW RESPONSE [REFERENCES PARSING]: %s", raw)

    result = extract_json(raw)
    return result.get("references", [])


MATCHING_SYSTEM_PROMPT = """You are an expert citation matching system. Match in-text citations to reference list entries and determine the match quality.

Rules:
- Exact match: author surname(s) + year match perfectly
- Fuzzy match: minor spelling variations (e.g. Smyth vs Smith) or year discrepancies (e.g. 2019 in text vs 2020 in reference list)
- AI-verified: complex cases like corporate authors, translated works
- No match: citation that cannot be matched to any reference
- Explicitly flag spelling_mismatch or year_mismatch in issues list if detected
- Provide confidence score 0.0-1.0"""


async def match_citations_to_references(
    citations: list[dict],
    references: list[dict],
) -> list[dict]:
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
1. Which reference it matches (by position index, null if no match)
2. The match type: exact, fuzzy, ai_verified, or none
3. Confidence score 0.0-1.0
4. Detect any author spelling mismatches or year mismatches between citation and reference

Return a JSON object:
{schema_example}"""

    raw = await async_call_gemini(prompt, system_instruction=MATCHING_SYSTEM_PROMPT)
    logger.debug("AI RAW RESPONSE [CITATIONS & REFERENCES MATCHING]: %s", raw)

    result = extract_json(raw)
    return result.get("matches", [])


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
    citations: list[dict],
    references: list[dict],
) -> list[dict]:
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

    raw = await async_call_gemini(prompt, system_instruction=STYLE_CHECK_SYSTEM_PROMPT)
    logger.debug("AI RAW RESPONSE [STYLE CHECKING]: %s", raw)

    result = extract_json(raw)
    return result.get("style_warnings", [])
