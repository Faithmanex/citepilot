"""Shared document-analysis orchestration used by the REST endpoint."""
import asyncio
import logging
import re
from typing import Dict, List

from .citation_extractor import (
    check_style,
    extract_citations,
    match_citations_to_references,
    parse_references,
)
from .crossref_service import validate_reference_with_crossref
from .openalex_service import validate_reference_with_openalex
from .recency_service import calculate_publication_recency
from .retraction_service import check_retraction_status
from .uncited_claims_detector import detect_uncited_claims

logger = logging.getLogger(__name__)


def _normalize_key(text: str) -> str:
    """Normalizes raw citation text for lookups (whitespace- and case-insensitive)."""
    return re.sub(r"\s+", " ", text.strip().lower())


async def run_analysis_pipeline(
    body_text: str,
    ref_text: str,
    para_meta: List[Dict],
    citation_style: str,
) -> Dict:
    """
    Runs the full analysis pipeline: AI extraction (citations, references, uncited claims),
    citation-to-reference matching, style checking, multi-provider reference verification
    (Crossref with OpenAlex fallback), and retraction checks.

    Returns the analysis payload consumed by the REST endpoint.
    """
    task_citations = extract_citations(body_text, citation_style) if body_text else asyncio.sleep(0, result=[])
    task_references = parse_references(ref_text) if ref_text else asyncio.sleep(0, result=[])
    task_claims = detect_uncited_claims(body_text, para_meta) if body_text else asyncio.sleep(0, result=[])

    gathered = await asyncio.gather(task_citations, task_references, task_claims, return_exceptions=True)
    for result in gathered:
        if isinstance(result, Exception):
            raise result  # Re-raise first exception
    citations, refs, uncited_claims = gathered

    # Match citations to references if both exist
    matches = await match_citations_to_references(citations, refs) if (citations and refs) else []

    # Run check_style AFTER citations and references are extracted
    style_warnings = await check_style(body_text, citation_style, citations, refs) if body_text else []

    citation_results = _build_citation_results(citations, matches)
    crossref_results, openalex_results, retraction_results = await _verify_references(refs)
    ref_results = _build_reference_results(
        refs, citation_results, crossref_results, openalex_results, retraction_results
    )

    return {
        "citations": citation_results,
        "references": ref_results,
        "matches": matches,
        "style_warnings": style_warnings,
        "uncited_claims": uncited_claims,
        "recency": calculate_publication_recency(ref_results),
    }


def _build_citation_results(citations: List[Dict], matches: List[Dict]) -> List[Dict]:
    """Builds the API citation payloads, joining each citation with its best match."""
    match_list_by_text: Dict[str, List[Dict]] = {}
    for m in matches:
        key = _normalize_key(m.get("citation_raw_text", ""))
        if key:
            match_list_by_text.setdefault(key, []).append(m)

    citation_results = []
    for c in citations:
        key = _normalize_key(c.get("raw_text", ""))
        candidate_matches = match_list_by_text.get(key, [])
        match = candidate_matches[0] if candidate_matches else {}

        raw_idx = match.get("matched_reference_index")
        matched_ref_idx = None
        if raw_idx is not None:
            try:
                matched_ref_idx = int(str(raw_idx).strip())
            except (ValueError, TypeError):
                matched_ref_idx = None

        citation_results.append({
            "raw_text": c.get("raw_text", ""),
            "paragraph_index": c.get("paragraph_index", 0),
            "char_start": c.get("char_start", 0),
            "char_end": c.get("char_end", 0),
            "context": c.get("context", ""),
            "extracted_authors": c.get("extracted_authors", []),
            "extracted_year": c.get("extracted_year"),
            "citation_type": c.get("citation_type", "parenthetical"),
            "status": "matched" if matched_ref_idx is not None else "no_match",
            "confidence": match.get("confidence", 0.0),
            "matched_reference_index": matched_ref_idx,
            "match_type": match.get("match_type", "none"),
            "issues": match.get("issues", []),
        })

    return citation_results


async def _verify_references(refs: List[Dict]):
    """
    Runs Crossref validation, OpenAlex fallback for unverified references, and retraction checks.
    Reuses pre-fetched Crossref work metadata for retraction checks to avoid duplicate HTTP calls.
    """
    crossref_tasks = [validate_reference_with_crossref(r) for r in refs]
    crossref_results = await asyncio.gather(*crossref_tasks, return_exceptions=True) if crossref_tasks else []
    crossref_results = [r if not isinstance(r, Exception) else {} for r in crossref_results]

    # For references unverified by Crossref, attempt OpenAlex lookup as multi-provider fallback
    openalex_tasks = [
        validate_reference_with_openalex(r)
        if not cr.get("crossref_verified") and (r.get("parsed_doi") or r.get("parsed_title"))
        else asyncio.sleep(0, result={})
        for r, cr in zip(refs, crossref_results)
    ]
    openalex_results = await asyncio.gather(*openalex_tasks, return_exceptions=True) if openalex_tasks else []
    openalex_results = [r if not isinstance(r, Exception) else {} for r in openalex_results]

    retraction_tasks = [
        check_retraction_status(r.get("parsed_doi"), r.get("parsed_title"), crossref_work=cr.get("raw_work"))
        for r, cr in zip(refs, crossref_results)
    ]
    retraction_results = await asyncio.gather(*retraction_tasks, return_exceptions=True) if retraction_tasks else []
    retraction_results = [r if not isinstance(r, Exception) else {} for r in retraction_results]

    return crossref_results, openalex_results, retraction_results


def _build_reference_results(
    refs: List[Dict],
    citation_results: List[Dict],
    crossref_results: List[Dict],
    openalex_results: List[Dict],
    retraction_results: List[Dict],
) -> List[Dict]:
    """Builds the API reference payloads, merging OpenAlex fallback verification into Crossref data."""
    matched_indices = {
        cr.get("matched_reference_index")
        for cr in citation_results
        if cr.get("matched_reference_index") is not None
    }

    ref_results = []
    for i, r in enumerate(refs):
        cr_val = crossref_results[i] if i < len(crossref_results) else {}
        oa_val = openalex_results[i] if i < len(openalex_results) else {}
        ret_val = retraction_results[i] if i < len(retraction_results) else {}

        # Strip internal raw_work before returning to API response
        clean_cr_val = {k: v for k, v in cr_val.items() if k != "raw_work"}

        # If Crossref did not verify, apply OpenAlex fallback verification
        if not clean_cr_val.get("crossref_verified") and oa_val.get("verified"):
            clean_cr_val["crossref_verified"] = True
            clean_cr_val["provider"] = "openalex"
            clean_cr_val["canonical_title"] = oa_val.get("canonical_title")
            clean_cr_val["canonical_doi"] = oa_val.get("canonical_doi")
            clean_cr_val["discrepancies"] = oa_val.get("discrepancies", [])

        status = "cited" if i in matched_indices else "orphaned"
        if ret_val.get("is_retracted") or oa_val.get("is_retracted"):
            status = "retracted"

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
            "status": status,
            "crossref_validation": clean_cr_val,
            "retraction_info": ret_val,
        })

    return ref_results
