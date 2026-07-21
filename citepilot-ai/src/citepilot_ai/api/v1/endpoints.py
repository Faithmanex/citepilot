import asyncio
import json
import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response

from ...models.schemas import AnalyseResponse, DocxExportRequest, PdfExportRequest
from ...services.crossref_service import validate_reference_with_crossref
from ...services.document_parser import parse_document, split_body_and_references, _parse_txt_structured
from ...services.citation_extractor import (
    extract_citations,
    parse_references,
    match_citations_to_references,
    check_style,
)
from ...services.recency_service import calculate_publication_recency
from ...services.retraction_service import check_retraction_status
from ...services.uncited_claims_detector import detect_uncited_claims
from ...services.export_service import generate_pdf_report, generate_redline_docx
from ...services.llm import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_mode(mode: Optional[str]) -> str:
    m = (mode or "full").strip().lower()
    if m in ("reference_only", "references_only", "references"):
        return "reference_only"
    elif m in ("full", "manuscript"):
        return "full"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{mode}'. Allowed mode values: 'full', 'manuscript', 'reference_only', 'references_only'."
        )


@router.post("/analyse", response_model=AnalyseResponse)
async def analyse_document_endpoint(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    citation_style: str = Form("apa7"),
    mode: str = Form("full")
):
    start = time.time()
    norm_mode = normalize_mode(mode)

    body_text = ""
    ref_text = ""
    para_meta = []

    if file:
        orig_filename = Path(file.filename).name if file.filename else "upload.tmp"
        suffix = Path(orig_filename).suffix or ".tmp"
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            temp_path = Path(tmp.name)

        try:
            mime_type = file.content_type or "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            body_text, ref_text, para_meta = parse_document(str(temp_path), mime_type, mode=norm_mode)
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=f"File not found: {e}")
        except Exception as e:
            logger.error(f"Document parse error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid or corrupt document file: {e}")
        finally:
            if temp_path and temp_path.exists():
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass
    elif text:
        if not text.strip():
            raise HTTPException(status_code=400, detail="Provided text is empty.")
        if norm_mode == "reference_only":
            body_text = ""
            ref_text = text.strip()
            para_meta = _parse_txt_structured(ref_text)
        else:
            body_text, ref_text = split_body_and_references(text)
            para_meta = _parse_txt_structured(body_text)
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'file' must be provided.")

    try:
        task_citations = extract_citations(body_text, citation_style) if body_text else asyncio.sleep(0, result=[])
        task_references = parse_references(ref_text) if ref_text else asyncio.sleep(0, result=[])
        task_claims = detect_uncited_claims(body_text, para_meta) if body_text else asyncio.sleep(0, result=[])

        citations, refs, uncited_claims = await asyncio.gather(
            task_citations, task_references, task_claims
        )
    except AIServiceError as e:
        logger.error(f"AI Service Failure during document analysis: {e}")
        raise HTTPException(status_code=503, detail=f"AI Processing Service is currently unavailable: {e}")

    # Match citations to references if both exist
    matches = await match_citations_to_references(citations, refs) if (citations and refs) else []

    # Run check_style AFTER citations and references are extracted
    style_warnings = await check_style(body_text, citation_style, citations, refs) if body_text else []

    # Build matches list lookup safely
    match_list_by_text: Dict[str, List[Dict]] = {}
    for m in matches:
        key = m.get("citation_raw_text", "").strip().lower()
        if key:
            match_list_by_text.setdefault(key, []).append(m)

    citation_results = []
    for c in citations:
        key = c.get("raw_text", "").strip().lower()
        candidate_matches = match_list_by_text.get(key, [])
        match = candidate_matches.pop(0) if candidate_matches else {}

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

    # Validate references with Crossref
    ref_validation_tasks = [validate_reference_with_crossref(r) for r in refs]
    crossref_results = await asyncio.gather(*ref_validation_tasks) if ref_validation_tasks else []

    # Retraction checks using pre-fetched Crossref work metadata to prevent duplicate HTTP calls
    retraction_tasks = []
    for i, r in enumerate(refs):
        cr_data = crossref_results[i] if i < len(crossref_results) else {}
        cr_work = cr_data.get("raw_work")
        retraction_tasks.append(check_retraction_status(r.get("parsed_doi"), r.get("parsed_title"), crossref_work=cr_work))

    retraction_results = await asyncio.gather(*retraction_tasks) if retraction_tasks else []

    ref_results = []
    for i, r in enumerate(refs):
        # Check if reference index i is matched in citation_results safely
        is_cited = False
        for cr in citation_results:
            idx_val = cr.get("matched_reference_index")
            if idx_val is not None and isinstance(idx_val, int) and idx_val == i:
                is_cited = True
                break

        cr_val = crossref_results[i] if i < len(crossref_results) else {}
        ret_val = retraction_results[i] if i < len(retraction_results) else {}

        # Strip internal raw_work before returning to API response
        clean_cr_val = {k: v for k, v in cr_val.items() if k != "raw_work"}

        status = "cited" if is_cited else "orphaned"
        if ret_val.get("is_retracted"):
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

    recency_data = calculate_publication_recency(ref_results)

    elapsed = time.time() - start
    logger.info(f"Analysis completed in {elapsed:.2f}s")

    return {
        "mode": norm_mode,
        "elapsed_seconds": round(elapsed, 2),
        "citations": citation_results,
        "references": ref_results,
        "style_warnings": style_warnings,
        "uncited_claims": uncited_claims,
        "recency": recency_data
    }


@router.post("/export/pdf")
async def export_pdf_endpoint(request_data: Dict):
    try:
        # Extract payload dict safely whether passed as raw json dict or wrapped in 'data'
        payload = request_data.get("data", request_data) if isinstance(request_data, dict) else request_data
        pdf_bytes = generate_pdf_report(payload)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=citepilot_diagnostic_report.pdf"}
        )
    except Exception as e:
        logger.exception(f"PDF export failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report export.")


@router.post("/export/docx")
async def export_docx_endpoint(payload: Dict):
    try:
        text = payload.get("text", "") if isinstance(payload, dict) else ""
        data = payload.get("analysis_data", payload) if isinstance(payload, dict) else {}
        docx_bytes = generate_redline_docx(text, data)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=citepilot_redline_manuscript.docx"}
        )
    except Exception as e:
        logger.exception(f"DOCX export failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX export.")


@router.websocket("/ws/analyse")
async def websocket_analyse(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        req = json.loads(data)

        text = req.get("text", "")
        citation_style = req.get("citation_style", "apa7")
        mode = normalize_mode(req.get("mode", "full"))

        await websocket.send_json({"event": "progress", "message": "Parsing document paragraphs...", "percent": 10})
        body_text, ref_text = split_body_and_references(text)

        await websocket.send_json({"event": "progress", "message": "Extracting citations & references in parallel...", "percent": 35})
        citations, refs = await asyncio.gather(
            extract_citations(body_text, citation_style) if body_text else asyncio.sleep(0, result=[]),
            parse_references(ref_text) if ref_text else asyncio.sleep(0, result=[])
        )

        await websocket.send_json({"event": "progress", "message": "Matching citations & querying Crossref...", "percent": 70})
        matches = await match_citations_to_references(citations, refs) if (citations and refs) else []

        await websocket.send_json({"event": "progress", "message": "Auditing style & checking retractions...", "percent": 90})
        style_warnings = await check_style(body_text, citation_style, citations, refs) if body_text else []

        recency_data = calculate_publication_recency(refs)

        await websocket.send_json({
            "event": "complete",
            "percent": 100,
            "data": {
                "citations": citations,
                "references": refs,
                "matches": matches,
                "style_warnings": style_warnings,
                "recency": recency_data
            }
        })
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"event": "error", "message": "WebSocket processing error occurred."})
