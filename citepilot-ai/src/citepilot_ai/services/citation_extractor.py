import json
import logging
from typing import Optional

from .llm import call_gemini, extract_json

logger = logging.getLogger(__name__)

CITATION_EXTRACTION_SYSTEM_PROMPT = """You are an expert academic citation parser. Your task is to extract ALL in-text citations from academic text with high precision.

Rules:
- Extract parenthetical citations like (Author, Year), (Author & Author, Year)
- Extract narrative citations like Author (Year) or Author et al. (Year)
- Extract numeric citations like [1], [2,3], [1-3] and superscript numbers
- Extract footnote markers
- Do NOT flag generic year references like "the 2020 pandemic" as citations
- Return the exact raw text of each citation found
- Note the paragraph index (0-based), character start/end within that paragraph
- Provide surrounding context (~100 chars each side)
- Classify citation type as: parenthetical, narrative, numeric, or footnote
- Extract author surnames and year if present"""


async def extract_citations(text: str, citation_style: str) -> list[dict]:
    paragraphs = text.split("\n\n")
    doc_structure = []
    for i, para in enumerate(paragraphs):
        if para.strip():
            doc_structure.append({"index": i, "text": para.strip()[:2000]})

    truncated = json.dumps(doc_structure, ensure_ascii=False)
    if len(truncated) > 80000:
        truncated = truncated[:80000] + "...[TRUNCATED]"

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

    raw = call_gemini(prompt, system_instruction=CITATION_EXTRACTION_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("citations", [])


REFERENCE_PARSING_SYSTEM_PROMPT = """You are an expert bibliographic parser. Parse individual reference entries into structured metadata.

Rules:
- Split authors into given/family name objects
- Extract year, title, journal, volume, issue, pages, DOI, URL, ISBN, PMID
- Classify reference type: journal_article, book, chapter, conference, thesis, website, report, other
- Handle all citation styles (APA, Harvard, Vancouver, Chicago, MLA, IEEE, OSCOLA, Turabian)
- If a field is not present, set it to null"""


async def parse_references(reference_text: str) -> list[dict]:
    import json as _json
    schema_example = _json.dumps({
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
    prompt = f"""Parse the following reference list entries into structured metadata.

Reference text:
{reference_text[:50000]}

Return a JSON object with this structure:
{schema_example}"""

    raw = call_gemini(prompt, system_instruction=REFERENCE_PARSING_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("references", [])


MATCHING_SYSTEM_PROMPT = """You are an expert citation matching system. Match in-text citations to reference list entries and determine the match quality.

Rules:
- Exact match: author surname(s) + year match perfectly
- Fuzzy match: minor spelling variations or missing middle initials
- AI-verified: complex cases like corporate authors, translated works
- No match: citation that cannot be matched to any reference
- Provide confidence score 0.0-1.0
- Explain the reasoning for uncertain matches"""


async def match_citations_to_references(
    citations: list[dict],
    references: list[dict],
) -> list[dict]:
    import json as _json
    schema_example = _json.dumps({
        "matches": [{
            "citation_raw_text": "the exact citation text",
            "matched_reference_index": 0,
            "matched_reference_text": "the matched reference entry",
            "match_type": "exact|fuzzy|ai_verified|none",
            "confidence": 0.95,
            "author_score": 1.0,
            "year_score": 1.0,
            "issues": [{"type": "style_warning", "code": "MISSING_DOI", "message": "Reference entry is missing a DOI", "severity": "warning"}],
        }],
    }, indent=2)
    prompt = f"""Match the following in-text citations to reference list entries.

Citations:
{_json.dumps(citations, indent=2, ensure_ascii=False)[:30000]}

References:
{_json.dumps(references, indent=2, ensure_ascii=False)[:30000]}

For each citation, determine:
1. Which reference it matches (by position, null if no match)
2. The match type: exact, fuzzy, ai_verified, or none
3. Confidence score 0.0-1.0
4. Any issues detected

Return a JSON object:
{schema_example}"""

    raw = call_gemini(prompt, system_instruction=MATCHING_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("matches", [])


STYLE_CHECK_SYSTEM_PROMPT = """You are an expert citation style checker. Analyze citations and references for compliance with the specified citation style.

Check for:
- Missing commas between author and year in parenthetical citations
- Incorrect use of & vs and in narrative vs parenthetical citations
- Incorrect et al. usage
- Missing DOIs for journal articles (APA 7)
- Title capitalization issues
- Missing hanging indents
- Incorrect page range formatting
- Missing retrieval dates for websites"""


async def check_style(
    text: str,
    citation_style: str,
    citations: list[dict],
    references: list[dict],
) -> list[dict]:
    import json as _json
    schema_example = _json.dumps({
        "style_warnings": [{
            "code": "MISSING_DOI",
            "category": "completeness",
            "message": "Journal article reference missing DOI",
            "suggestion": "Add the DOI: https://doi.org/...",
            "severity": "warning|error|info",
            "paragraph_index": 0,
            "char_start": 0,
            "char_end": 0,
            "style_guide_ref": "APA 7, Section 9.34",
        }],
    }, indent=2)
    prompt = f"""Check the following document for citation style compliance.

Citation style: {citation_style}

Document paragraphs:
{text[:20000]}

Citations found:
{_json.dumps(citations, indent=2, ensure_ascii=False)[:10000]}

References found:
{_json.dumps(references, indent=2, ensure_ascii=False)[:10000]}

Return a JSON object with style warnings:
{schema_example}"""

    raw = call_gemini(prompt, system_instruction=STYLE_CHECK_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("style_warnings", [])
