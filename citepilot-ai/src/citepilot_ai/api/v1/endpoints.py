import logging
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ...models.schemas import AnalyseRequest, AnalyseResponse
from ...services.document_parser import parse_document
from ...services.citation_extractor import (
    extract_citations,
    parse_references,
    match_citations_to_references,
    check_style,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _split_text(text: str):
    """Split document text into body and reference section heuristically."""
    lines = text.split("\n")
    ref_start = None
    ref_indicators = [
        "references", "bibliography", "works cited", "works consulted",
        "further reading", "sources",
    ]
    for i, line in enumerate(lines):
        stripped = line.strip().lower().rstrip(":")
        if stripped in ref_indicators:
            ref_start = i
            break

    if ref_start is not None:
        body = "\n".join(lines[:ref_start])
        references = "\n".join(lines[ref_start:])
    else:
        body = text
        references = ""

    return body, references


@router.post("/analyse", response_model=AnalyseResponse)
async def analyse_document(req: AnalyseRequest):
    start = time.time()

    body_text, ref_text = _split_text(req.text)

    citations = await extract_citations(body_text, req.citation_style)
    refs = await parse_references(ref_text) if ref_text.strip() else []
    matches = await match_citations_to_references(citations, refs) if refs else []

    match_by_text = {}
    for m in matches:
        match_by_text[m.get("citation_raw_text", "")] = m

    citation_results = []
    for c in citations:
        match = match_by_text.get(c.get("raw_text", ""), {})
        matched_ref_idx = match.get("matched_reference_index")
        matched_ref = refs[matched_ref_idx] if matched_ref_idx is not None and matched_ref_idx < len(refs) else None

        citation_results.append({
            "raw_text": c["raw_text"],
            "paragraph_index": c.get("paragraph_index", 0),
            "char_start": c.get("char_start", 0),
            "char_end": c.get("char_end", 0),
            "context": c.get("context", ""),
            "extracted_authors": c.get("extracted_authors", []),
            "extracted_year": c.get("extracted_year"),
            "citation_type": c.get("citation_type", "parenthetical"),
            "status": "matched" if matched_ref else "no_match",
            "confidence": match.get("confidence"),
            "matched_reference_index": matched_ref_idx,
            "match_type": match.get("match_type"),
            "issues": match.get("issues", []),
        })

    ref_results = []
    for i, r in enumerate(refs):
        ref_results.append({
            "raw_entry": r.get("raw_entry", ""),
            "position": r.get("position", i + 1),
            "parsed_authors": r.get("parsed_authors", []),
            "parsed_year": r.get("parsed_year"),
            "parsed_title": r.get("parsed_title"),
            "parsed_journal": r.get("parsed_journal"),
            "parsed_volume": r.get("parsed_volume"),
            "parsed_issue": r.get("parsed_issue"),
            "parsed_pages": r.get("parsed_pages"),
            "parsed_doi": r.get("parsed_doi"),
            "parsed_url": r.get("parsed_url"),
            "reference_type": r.get("reference_type", "unknown"),
            "status": "cited" if any(
                cr["matched_reference_index"] == i for cr in citation_results
            ) else "orphaned",
        })

    style_warnings = await check_style(body_text, req.citation_style, citations, refs)

    elapsed = time.time() - start
    logger.info(f"Analysis complete in {elapsed:.2f}s: {len(citations)} citations, {len(refs)} references, {len(style_warnings)} style warnings")

    return AnalyseResponse(
        citations=citation_results,
        references=ref_results,
        style_warnings=style_warnings,
    )


@router.post("/parse-text")
async def parse_text_file(file_path: str, mime_type: str):
    try:
        if not Path(file_path).exists():
            raise HTTPException(status_code=400, detail=f"File not found: {file_path}")
        text = parse_document(file_path, mime_type)
        return {"text": text, "length": len(text)}
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    return {"status": "ok", "service": "citepilot-ai"}
