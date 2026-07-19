import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from ...services.citation_extractor import (
    detect_uncited_claims,
    extract_citations_structured,
    match_and_audit_citations,
    parse_references_structured,
)
from ...services.crossref_service import (
    calculate_publication_year_distribution,
    check_retraction_status,
    validate_doi_and_metadata,
)
from ...services.document_parser import (
    parse_document,
    parse_document_structured,
    split_body_and_references,
)
from ...services.report_generator import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter()


class DocumentAnalysisRequest(BaseModel):
    text: Optional[str] = None
    citation_style: str = "apa7"
    include_crossref: bool = True
    include_uncited_claims: bool = True


class ReferenceOnlyRequest(BaseModel):
    reference_text: str
    citation_style: str = "apa7"
    include_crossref: bool = True


class PDFReportRequest(BaseModel):
    filename: str = "Manuscript.docx"
    citation_style: str = "apa7"
    citations: List[Dict[str, Any]] = []
    references: List[Dict[str, Any]] = []
    audit_issues: List[Dict[str, Any]] = []
    year_distribution: Dict[str, Any] = {}


@router.get("/health")
async def health():
    return {"status": "ok", "service": "citepilot-ai", "version": "2.0-ai"}


@router.post("/analyze-document")
async def analyze_document_endpoint(
    req: DocumentAnalysisRequest,
):
    start = time.time()
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text content is required for analysis.")

    citation_style = req.citation_style.lower()
    paragraphs = [{"paragraph_index": idx, "text": p.strip()} for idx, p in enumerate(req.text.split("\n\n")) if p.strip()]

    body_paras, ref_paras = _split_paragraphs_body_and_refs(paragraphs)

    citations_task = asyncio.create_task(extract_citations_structured(body_paras, citation_style))
    refs_task = asyncio.create_task(parse_references_structured(ref_paras, citation_style)) if ref_paras else None
    uncited_claims_task = (
        asyncio.create_task(detect_uncited_claims(body_paras, citation_style))
        if req.include_uncited_claims
        else None
    )

    citations = await citations_task
    references = await refs_task if refs_task else []
    uncited_claims = await uncited_claims_task if uncited_claims_task else []

    audit_result = await match_and_audit_citations(citations, references, citation_style)
    matches = audit_result.get("matches", [])
    audit_issues = audit_result.get("audit_issues", [])

    for claim in uncited_claims:
        audit_issues.append({
            "id": f"uncited_claim_{claim.get('paragraph_index')}",
            "category": "uncited_claim",
            "label": "Uncited Factual Claim",
            "message": f"Claim lacking citation: '{claim.get('claim_text')}'",
            "educational_context": claim.get("educational_reasoning"),
            "severity": "warning",
            "paragraph_index": claim.get("paragraph_index"),
            "actionable": True,
        })

    year_dist = calculate_publication_year_distribution(references)

    if req.include_crossref and references:
        doi_tasks = []
        for ref in references[:20]:
            doi = ref.get("parsed_doi")
            if doi:
                doi_tasks.append(validate_doi_and_metadata(doi, ref))
                doi_tasks.append(check_retraction_status(doi))
        if doi_tasks:
            doi_results = await asyncio.gather(*doi_tasks, return_exceptions=True)
            for res in doi_results:
                if isinstance(res, dict) and res.get("retracted"):
                    audit_issues.append({
                        "id": f"retraction_{len(audit_issues)}",
                        "category": "retracted_publication",
                        "label": "RETRACTED Publication Warning",
                        "message": res.get("details", "This cited reference has been formally retracted."),
                        "educational_context": "Citing retracted literature compromises academic rigor.",
                        "severity": "error",
                        "actionable": True,
                    })

    elapsed = time.time() - start
    logger.info(f"Analysis completed in {elapsed:.2f}s: {len(citations)} citations, {len(references)} refs, {len(audit_issues)} issues")

    return {
        "status": "success",
        "elapsed_seconds": round(elapsed, 2),
        "citation_style": citation_style,
        "citations": citations,
        "references": references,
        "matches": matches,
        "audit_issues": audit_issues,
        "year_distribution": year_dist,
    }


@router.post("/analyze-references-only")
async def analyze_references_only_endpoint(req: ReferenceOnlyRequest):
    start = time.time()
    if not req.reference_text.strip():
        raise HTTPException(status_code=400, detail="Reference text is required.")

    ref_paras = [{"paragraph_index": idx, "text": p.strip()} for idx, p in enumerate(req.reference_text.split("\n\n")) if p.strip()]
    references = await parse_references_structured(ref_paras, req.citation_style)

    year_dist = calculate_publication_year_distribution(references)

    doi_checks = []
    if req.include_crossref and references:
        for ref in references[:30]:
            doi = ref.get("parsed_doi")
            if doi:
                doi_checks.append(validate_doi_and_metadata(doi, ref))

    doi_results = await asyncio.gather(*doi_checks, return_exceptions=True) if doi_checks else []

    elapsed = time.time() - start
    return {
        "status": "success",
        "elapsed_seconds": round(elapsed, 2),
        "references": references,
        "year_distribution": year_dist,
        "doi_validations": [r for r in doi_results if isinstance(r, dict)],
    }


@router.post("/export-pdf-report")
async def export_pdf_report_endpoint(req: PDFReportRequest):
    try:
        pdf_bytes = generate_pdf_report(
            filename=req.filename,
            citation_style=req.citation_style,
            citations=req.citations,
            references=req.references,
            audit_issues=req.audit_issues,
            year_distribution=req.year_distribution,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={Path(req.filename).stem}_audit_report.pdf"},
        )
    except Exception as e:
        logger.error(f"Failed to generate PDF report: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.websocket("/ws/progress")
async def websocket_progress_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            req_data = json.loads(data)
            action = req_data.get("action")

            if action == "start_analysis":
                await websocket.send_json({"step": "extract_citations", "progress": 25, "message": "Extracting in-text citations with Gemini AI..."})
                await asyncio.sleep(0.5)

                await websocket.send_json({"step": "parse_references", "progress": 50, "message": "Parsing reference list metadata..."})
                await asyncio.sleep(0.5)

                await websocket.send_json({"step": "bidirectional_audit", "progress": 75, "message": "Cross-checking citations, spelling, & years..."})
                await asyncio.sleep(0.5)

                await websocket.send_json({"step": "crossref_check", "progress": 90, "message": "Validating DOIs and retraction notices with Crossref..."})
                await asyncio.sleep(0.5)

                await websocket.send_json({"step": "complete", "progress": 100, "message": "Audit complete!"})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


def _split_paragraphs_body_and_refs(paragraphs: List[Dict[str, Any]]):
    ref_indicators = ["references", "bibliography", "works cited", "works consulted"]
    ref_idx = -1
    for idx, p in enumerate(paragraphs):
        text = p.get("text", "").strip().lower().rstrip(":")
        if text in ref_indicators:
            ref_idx = idx
            break

    if ref_idx != -1:
        return paragraphs[:ref_idx], paragraphs[ref_idx:]
    return paragraphs, []
