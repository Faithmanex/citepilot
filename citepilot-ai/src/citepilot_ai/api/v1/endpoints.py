import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from ...models.schemas import AnalyseResponse
from ...services.analysis_pipeline import run_analysis_pipeline
from ...services.document_parser import (
    parse_document,
    parse_txt_structured,
    split_body_and_references,
)
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
            para_meta = parse_txt_structured(ref_text)
        else:
            body_text, ref_text = split_body_and_references(text)
            para_meta = parse_txt_structured(body_text)
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'file' must be provided.")

    try:
        results = await run_analysis_pipeline(body_text, ref_text, para_meta, citation_style)
    except AIServiceError as e:
        logger.error(f"AI Service Failure during document analysis: {e}")
        raise HTTPException(status_code=503, detail=f"AI Processing Service is currently unavailable: {e}")

    elapsed = time.time() - start
    logger.info(f"Analysis completed in {elapsed:.2f}s")

    return {
        "mode": norm_mode,
        "elapsed_seconds": round(elapsed, 2),
        "citations": results["citations"],
        "references": results["references"],
        "style_warnings": results["style_warnings"],
        "uncited_claims": results["uncited_claims"],
        "recency": results["recency"],
    }


@router.post("/export/pdf")
async def export_pdf_endpoint(request_data: Dict):
    try:
        # Extract payload dict safely whether passed as raw json dict or wrapped in 'data'
        payload = request_data.get("data", request_data) if isinstance(request_data, dict) else request_data
        pdf_bytes = generate_pdf_report(payload)
        # NOTE: no Content-Disposition header here. The web client reads the body via
        # fetch() + blob() and saves the file itself; an attachment disposition makes
        # Chromium divert the response to the download manager, hanging the fetch.
        return Response(content=pdf_bytes, media_type="application/pdf")
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
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        logger.exception(f"DOCX export failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX export.")
