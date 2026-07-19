import io
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pdfplumber
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


def parse_document(file_path: str, mime_type: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _parse_docx_text(path)
    elif mime_type == "application/pdf":
        return _parse_pdf_text(path)
    elif mime_type == "text/plain":
        return path.read_text(encoding="utf-8")
    else:
        return _parse_fallback_text(path)


def parse_document_structured(file_path: str, mime_type: str) -> List[Dict[str, Any]]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _parse_docx_structured(path)
    elif mime_type == "application/pdf":
        return _parse_pdf_structured(path)
    else:
        return _parse_txt_structured(path)


def split_body_and_references(paragraphs: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    ref_patterns = [
        r"^\s*(?:References|Bibliography|Works\s+Cited)\s*$",
        r"^\s*(?:REFERENCES|BIBLIOGRAPHY|WORKS\s+CITED)\s*$"
    ]
    ref_start_idx = -1
    for idx, p in enumerate(paragraphs):
        text = p.get("text", "")
        for pat in ref_patterns:
            if re.search(pat, text, re.IGNORECASE):
                ref_start_idx = idx
                break
        if ref_start_idx != -1:
            break

    if ref_start_idx != -1:
        body = paragraphs[:ref_start_idx]
        refs = paragraphs[ref_start_idx:]
        return body, refs
    return paragraphs, []


def _parse_docx_text(path: Path) -> str:
    doc = DocxDocument(str(path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _parse_docx_structured(path: Path) -> List[Dict[str, Any]]:
    doc = DocxDocument(str(path))
    structured = []
    para_idx = 0
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        style_name = p.style.name if p.style else "Normal"
        is_heading = style_name.lower().startswith("heading") or style_name.lower() in ["title", "subtitle"]
        structured.append({
            "paragraph_index": para_idx,
            "text": text,
            "style_name": style_name,
            "is_heading": is_heading,
        })
        para_idx += 1
    return structured


def _parse_pdf_text(path: Path) -> str:
    text_parts = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text and text.strip():
                text_parts.append(text.strip())
    return "\n\n".join(text_parts)


def _parse_pdf_structured(path: Path) -> List[Dict[str, Any]]:
    structured = []
    para_idx = 0
    with pdfplumber.open(str(path)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text:
                continue
            lines = text.split("\n")
            for line in lines:
                t = line.strip()
                if not t:
                    continue
                structured.append({
                    "paragraph_index": para_idx,
                    "page_number": page_num,
                    "text": t,
                    "style_name": "Body Text",
                    "is_heading": False,
                })
                para_idx += 1
    return structured


def _parse_txt_structured(path: Path) -> List[Dict[str, Any]]:
    content = path.read_text(encoding="utf-8", errors="replace")
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    structured = []
    for idx, text in enumerate(paragraphs):
        structured.append({
            "paragraph_index": idx,
            "text": text,
            "style_name": "Normal",
            "is_heading": False,
        })
    return structured


def _parse_fallback_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")
