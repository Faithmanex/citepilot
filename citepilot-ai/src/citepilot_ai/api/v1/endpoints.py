import logging
import os
import re
import tempfile
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import Response

from ...config import settings
from ...models.schemas import AnalyseResponse, DocxExportRequest, PdfExportRequest
from ...services.analysis_pipeline import run_analysis_pipeline
from ...services.document_parser import (
    parse_document,
    parse_txt_structured,
    split_body_and_references,
)
from ...services.export_service import generate_pdf_report, generate_redline_docx, generate_clean_docx
from ...services.llm import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Auth dependency ---------------------------------------------------------

def verify_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    authorization: Optional[str] = Header(default=None),
):
    """If settings.api_key is set, require matching X-API-Key or Bearer token."""
    expected = (settings.api_key or "").strip()
    if not expected:
        return  # open mode (dev / when API key not configured)
    provided: Optional[str] = None
    if x_api_key and x_api_key.strip():
        provided = x_api_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided = authorization[7:].strip()
    if provided != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# --- Rate limiting (in-memory sliding window) --------------------------------

_rate_buckets: Dict[str, deque] = defaultdict(deque)
_RATE_WINDOW_S = 60


def rate_limit(request: Request):
    # Disable rate limiting during pytest (PYTEST_CURRENT_TEST is set) to avoid flaky tests.
    if os.getenv("PYTEST_CURRENT_TEST"):
        return
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return
    # Prefer X-Forwarded-For when behind Railway, else client host
    forwarded = request.headers.get("x-forwarded-for")
    ip = (forwarded.split(",")[0].strip() if forwarded else None) or (
        request.client.host if request.client else "unknown"
    )
    now = time.monotonic()
    bucket = _rate_buckets[ip]
    # Evict entries outside window
    while bucket and bucket[0] <= now - _RATE_WINDOW_S:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again shortly.")
    bucket.append(now)


ALLOWED_CITATION_STYLES = {
    "apa7",
    "apa6",
    "harvard",
    "vancouver",
    "chicago-author-date",
    "chicago-notes",
    "mla9",
    "ieee",
    "oscola",
    "turabian",
}


def normalize_mode(mode: Optional[str]) -> str:
    m = (mode or "full").strip().lower()
    if m in ("reference_only", "references_only", "references"):
        return "reference_only"
    elif m in ("full", "manuscript"):
        return "full"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{mode}'. Allowed mode values: 'full', 'manuscript', 'reference_only', 'references_only'.",
        )


def sanitize_error_detail(e: Exception) -> str:
    """Return a safe, non-leaky error message for clients; log full detail internally."""
    # Never expose filesystem paths, stack traces, or upstream LLM/provider internals.
    msg = str(e)
    # Strip temp-file paths if present
    msg = re.sub(r"[A-Za-z]:\\[^\s]*", "[path]", msg)
    msg = re.sub(r"/tmp/[^\s]*", "[path]", msg)
    # Truncate
    if len(msg) > 300:
        msg = msg[:300] + "…"
    return msg


@router.post("/analyse", response_model=AnalyseResponse, dependencies=[Depends(verify_api_key), Depends(rate_limit)])
async def analyse_document_endpoint(
    request: Request,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    citation_style: str = Form("apa7"),
    mode: str = Form("full"),
):
    start = time.time()
    norm_mode = normalize_mode(mode)

    # Validate citation_style server-side (previously only in dead Pydantic schema)
    style = (citation_style or "apa7").strip().lower()
    if style not in ALLOWED_CITATION_STYLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid citation_style '{citation_style}'. Allowed: {', '.join(sorted(ALLOWED_CITATION_STYLES))}",
        )

    max_text_chars = settings.max_text_chars
    max_upload_bytes = settings.max_upload_mb * 1024 * 1024

    body_text = ""
    ref_text = ""
    para_meta = []

    if file:
        orig_filename = Path(file.filename).name if file.filename else "upload.tmp"
        suffix = Path(orig_filename).suffix or ".tmp"

        # Enforce upload size cap before buffering too much
        # file.size may be None depending on client; fall back to reading with limit.
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(content) > max_upload_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({len(content)} bytes). Maximum is {settings.max_upload_mb} MB.",
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            temp_path = Path(tmp.name)

        try:
            mime_type = file.content_type or "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            body_text, ref_text, para_meta = parse_document(str(temp_path), mime_type, mode=norm_mode)
            # Enforce combined text cap after parsing
            if len(body_text) + len(ref_text) > max_text_chars:
                raise HTTPException(
                    status_code=413,
                    detail=f"Document too large after extraction. Maximum is {max_text_chars:,} characters.",
                )
        except FileNotFoundError:
            logger.exception("Temp file missing during parse")
            raise HTTPException(status_code=400, detail="Uploaded file could not be processed. Please re-upload.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Document parse error: {e}", exc_info=True)
            raise HTTPException(status_code=400, detail="Invalid or corrupt document file.")
        finally:
            if temp_path and temp_path.exists():
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass
    elif text:
        if not text.strip():
            raise HTTPException(status_code=400, detail="Provided text is empty.")
        if len(text) > max_text_chars:
            raise HTTPException(
                status_code=413,
                detail=f"Text too large ({len(text):,} chars). Maximum is {max_text_chars:,} characters.",
            )
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
        results = await run_analysis_pipeline(body_text, ref_text, para_meta, style)
    except AIServiceError as e:
        logger.error(f"AI Service Failure during document analysis: {e}", exc_info=True)
        # Do not leak upstream provider error detail
        raise HTTPException(status_code=503, detail="AI Processing Service is currently unavailable. Please try again shortly.")

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


@router.post("/export/pdf", dependencies=[Depends(verify_api_key), Depends(rate_limit)])
async def export_pdf_endpoint(payload: PdfExportRequest):
    try:
        data = payload.resolve_data()
        pdf_bytes = generate_pdf_report(data)
        # NOTE: no Content-Disposition header here. The web client reads the body via
        # fetch() + blob() and saves the file itself; an attachment disposition makes
        # Chromium divert the response to the download manager, hanging the fetch.
        return Response(content=pdf_bytes, media_type="application/pdf")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"PDF export failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report export.")


@router.post("/export/docx", dependencies=[Depends(verify_api_key), Depends(rate_limit)])
async def export_docx_endpoint(payload: DocxExportRequest):
    try:
        analysis_data = payload.analysis_data
        # Backward compat: if analysis_data is empty but extra keys look like analysis payload, use them
        if not analysis_data:
            extra = getattr(payload, "model_extra", None) or {}
            if extra and any(k in extra for k in ("citations", "references", "style_warnings")):
                analysis_data = dict(extra)
        if payload.mode == "clean":
            docx_bytes = generate_clean_docx(payload.text)
        else:
            docx_bytes = generate_redline_docx(payload.text, analysis_data)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"DOCX export failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX export.")
