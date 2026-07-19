import json
import logging
from typing import Any, Dict, List, Optional

from .llm import call_gemini, extract_json

logger = logging.getLogger(__name__)

CITATION_EXTRACTION_SYSTEM_PROMPT = """You are an expert academic citation parser. Your task is to extract ALL in-text citations from academic manuscript paragraphs with high precision.

Rules:
- Extract parenthetical citations like (Author, Year), (Author & Author, Year), (Author et al., Year)
- Extract narrative citations like Author (Year) or Author et al. (Year)
- Extract numeric citations like [1], [2,3], [1-3] and superscript numbers
- Extract footnote and endnote markers
- Do NOT flag generic year references like "the 2020 pandemic" or "in 2021 we observed" unless tied to a citation
- Extract author surnames and year if present
- Preserve paragraph_index (0-based) provided in the paragraph input object
- Extract character start and end offsets within that paragraph text
- Provide surrounding context (~100 chars each side)
- Classify citation_type as: parenthetical, narrative, numeric, or footnote"""

REFERENCE_PARSING_SYSTEM_PROMPT = """You are an expert bibliographic reference parser. Parse reference list entries into structured metadata objects.

Rules:
- Split authors into given/family name objects (e.g. {"family": "Smith", "given": "J. A."})
- Extract publication year (int), title, journal/container, volume, issue, pages, DOI, URL, ISBN, PMID
- Classify reference_type: journal_article, book, chapter, conference, thesis, website, report, other
- Handle all citation styles (APA 6/7, MLA 9, Harvard, Chicago, Vancouver, IEEE, OSCOLA, Turabian)
- Retain entry position (0-based)
- If a metadata field is not present, set it to null"""

MATCHING_AND_AUDIT_SYSTEM_PROMPT = """You are an expert citation matching and consistency auditing system.
Perform a dynamic, context-aware bidirectional audit between in-text citations and reference list entries for the specified citation style: {citation_style}.

AUDIT RULES:
1. BIDIRECTIONAL MATCHING:
   - Match each in-text citation to its corresponding reference list item.
   - Flag in-text citations that have NO matching bibliography entry (Category: "missing_reference", Severity: "error").
   - Flag bibliography items that are NEVER cited anywhere in the manuscript body (Category: "uncited_reference", Severity: "warning").

2. AUTHOR SPELLING & ACCENT AUDIT:
   - Contextually check for author surname spelling variations, typos, or accent discrepancies between body citations and reference entries (e.g. "Smyth" vs "Smith", "Müller" vs "Muller"). Flag these as Category: "author_spelling_mismatch", Severity: "error".

3. YEAR DISCREPANCY AUDIT:
   - Semantically identify mismatches between the publication year cited in the body text vs the year stated in the reference list item. Flag as Category: "year_mismatch", Severity: "error".

4. STYLE & DOCUMENT STRUCTURE COMPLIANCE:
   - Audit style-specific "et al." usage rules for {citation_style} (e.g., author count thresholds).
   - Audit in-text citation ordering inside parenthetical citations (e.g. chronological or alphabetical rules).
   - Audit reference list alphabetical sorting and missing page numbers (p. / pp.) for direct quote citations.
   - Dynamically evaluate document structure & front matter (e.g., paper title present but missing author/affiliation, or placeholder text such as "[Insert TOC here]" or "TBD").
   Flag issues as Category: "formatting" | "content" | "style_warning" | "document_structure", Severity: "error" | "warning" | "info".

5. CONFIDENCE & REASONING:
   - Match type: "exact", "fuzzy", "ai_verified", or "none".
   - Confidence score between 0.0 and 1.0.
   - Provide clear, actionable educational feedback explaining the style manual rule."""

UNCITED_CLAIM_DETECTION_SYSTEM_PROMPT = """You are an academic writing auditor. Scan manuscript body paragraphs to identify sweeping factual, statistical, empirical, or theoretical assertions that lack any supporting citation.

Rules:
- Identify sentences making specific claims (e.g., "Studies show that 85% of users...", "Recent breakthroughs have proven...", "It is widely established that...") that have no in-text citation attached.
- Do NOT flag general introductory statements, transitions, or the author's own original methodology/findings.
- Return an array of uncited_claims with paragraph_index, claim_text, severity ("warning"), and educational_reasoning."""


async def extract_citations_structured(paragraphs: List[Dict[str, Any]], citation_style: str) -> List[Dict[str, Any]]:
    payload = json.dumps(paragraphs, ensure_ascii=False)
    if len(payload) > 100000:
        payload = payload[:100000] + "...[TRUNCATED]"

    prompt = f"""Analyze the following document paragraphs and extract all in-text citations.

Citation style: {citation_style}

Paragraphs:
{payload}

Return JSON:
{{
  "citations": [
    {{
      "raw_text": "Smith (2020)",
      "paragraph_index": 0,
      "char_start": 12,
      "char_end": 24,
      "context": "According to Smith (2020), digital workflows...",
      "extracted_authors": ["Smith"],
      "extracted_year": 2020,
      "citation_type": "narrative"
    }}
  ]
}}"""

    raw = call_gemini(prompt, system_instruction=CITATION_EXTRACTION_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("citations", [])


async def parse_references_structured(reference_paragraphs: List[Dict[str, Any]], citation_style: str) -> List[Dict[str, Any]]:
    payload = json.dumps(reference_paragraphs, ensure_ascii=False)
    if len(payload) > 100000:
        payload = payload[:100000] + "...[TRUNCATED]"

    prompt = f"""Parse the following reference list entries into structured bibliographic metadata.

Citation style: {citation_style}

Reference entries:
{payload}

Return JSON:
{{
  "references": [
    {{
      "raw_entry": "Smith, J. A. (2020). Digital workflows. Journal of Systems, 12(2), 45-60. https://doi.org/10.1000/xyz",
      "position": 0,
      "parsed_authors": [{{"family": "Smith", "given": "J. A."}}],
      "parsed_year": 2020,
      "parsed_title": "Digital workflows",
      "parsed_journal": "Journal of Systems",
      "parsed_volume": "12",
      "parsed_issue": "2",
      "parsed_pages": "45-60",
      "parsed_doi": "10.1000/xyz",
      "parsed_url": "https://doi.org/10.1000/xyz",
      "reference_type": "journal_article"
    }}
  ]
}}"""

    raw = call_gemini(prompt, system_instruction=REFERENCE_PARSING_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("references", [])


async def match_and_audit_citations(
    citations: List[Dict[str, Any]],
    references: List[Dict[str, Any]],
    citation_style: str
) -> Dict[str, Any]:
    system_instruction = MATCHING_AND_AUDIT_SYSTEM_PROMPT.format(citation_style=citation_style)

    prompt = f"""Perform a comprehensive citation ↔ reference bidirectional match and consistency audit for {citation_style}.

Citations ({len(citations)} found):
{json.dumps(citations, indent=2, ensure_ascii=False)[:35000]}

References ({len(references)} found):
{json.dumps(references, indent=2, ensure_ascii=False)[:35000]}

Return JSON:
{{
  "matches": [
    {{
      "citation_raw_text": "Smith (2020)",
      "matched_reference_index": 0,
      "matched_reference_text": "Smith, J. A. (2020)...",
      "match_type": "exact",
      "confidence": 1.0,
      "issues": []
    }}
  ],
  "audit_issues": [
    {{
      "id": "issue_001",
      "category": "missing_reference|uncited_reference|author_spelling_mismatch|year_mismatch|style_warning",
      "label": "Brief Title",
      "message": "Detailed explanation of discrepancy",
      "educational_context": "Explanation of style manual rule",
      "severity": "error|warning|info",
      "paragraph_index": 0,
      "actionable": true
    }}
  ]
}}"""

    raw = call_gemini(prompt, system_instruction=system_instruction)
    return extract_json(raw)


async def detect_uncited_claims(body_paragraphs: List[Dict[str, Any]], citation_style: str) -> List[Dict[str, Any]]:
    payload = json.dumps(body_paragraphs, ensure_ascii=False)
    if len(payload) > 60000:
        payload = payload[:60000] + "...[TRUNCATED]"

    prompt = f"""Scan the following manuscript body paragraphs for factual, statistical, or empirical claims that lack supporting citations under {citation_style} rules.

Paragraphs:
{payload}

Return JSON:
{{
  "uncited_claims": [
    {{
      "paragraph_index": 0,
      "claim_text": "Studies show that 92% of researchers...",
      "severity": "warning",
      "educational_reasoning": "Specific statistical claims require a supporting source citation."
    }}
  ]
}}"""

    raw = call_gemini(prompt, system_instruction=UNCITED_CLAIM_DETECTION_SYSTEM_PROMPT)
    result = extract_json(raw)
    return result.get("uncited_claims", [])
