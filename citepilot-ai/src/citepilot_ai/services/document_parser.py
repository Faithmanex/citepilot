import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pdfplumber
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


def parse_document(file_path: str, mime_type: str, mode: str = "full") -> Tuple[str, str, List[Dict]]:
    """
    Parses a document file (.docx, .pdf, or text) and returns:
      - body_text: string containing body paragraphs
      - reference_text: string containing reference list text
      - paragraph_metadata: list of structured paragraph dictionaries
    Mode can be 'full' or 'reference_only'.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    mime_clean = (mime_type or "").lower()
    if mime_clean == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or path.suffix.lower() == ".docx":
        raw_text, paragraphs_meta = _parse_docx_structured(path)
    elif mime_clean == "application/pdf" or path.suffix.lower() == ".pdf":
        raw_text, paragraphs_meta = _parse_pdf_structured(path)
    else:
        raw_text = path.read_text(encoding="utf-8", errors="replace")
        paragraphs_meta = parse_txt_structured(raw_text)

    mode_clean = (mode or "full").strip().lower()
    if mode_clean in ("reference_only", "references_only", "references"):
        return "", raw_text.strip(), paragraphs_meta

    body_text, ref_text = split_body_and_references(raw_text)
    return body_text, ref_text, paragraphs_meta


def split_body_and_references(text: str) -> Tuple[str, str]:
    """
    Splits document text into body and reference sections.
    Safely ignores TOC mentions and early headings, falling back to full text
    so AI document architecture models can contextually process the document.
    """
    patterns = [
        r"(?:^|\n)#*\s*(?:\d+[\.\s]+|Chapter\s+\d+[:\s]+)?(?:References|Bibliography|Works\s+Cited|Reference\s+List)\b:?\s*(?:\n|$)",
        r"(?:^|\n)#*\s*(?:\d+[\.\s]+)?(?:REFERENCES|BIBLIOGRAPHY|WORKS\s+CITED|REFERENCE\s+LIST)\b:?\s*(?:\n|$)",
    ]
    for pat in patterns:
        matches = list(re.finditer(pat, text, flags=re.IGNORECASE))
        if matches:
            # Check matches from last to first to avoid TOC lines near top of document
            for m in reversed(matches):
                start_idx = m.start()
                # Ensure the match is not in the first 15% of document if doc is long
                if start_idx > len(text) * 0.15 or len(text) < 2000:
                    body = text[:start_idx].strip()
                    refs = text[m.end():].strip()
                    if len(refs) > 10:
                        return body, refs

    return text.strip(), text.strip()


def _parse_docx_structured(path: Path) -> Tuple[str, List[Dict]]:
    doc = DocxDocument(str(path))
    paragraphs_meta = []
    text_parts = []

    idx = 0
    for para in doc.paragraphs:
        txt = para.text.strip()
        if not txt:
            continue

        style_name = para.style.name if para.style else "Normal"
        is_heading = style_name.startswith("Heading")

        paragraphs_meta.append({
            "paragraph_index": idx,
            "text": txt,
            "style_name": style_name,
            "is_heading": is_heading,
            "char_count": len(txt)
        })
        text_parts.append(txt)
        idx += 1

    return "\n\n".join(text_parts), paragraphs_meta


def _append_paragraph(
    paragraphs_meta: List[Dict],
    text_parts: List[str],
    idx: int,
    text: str,
    page_number: Optional[int] = None,
) -> int:
    """Appends a paragraph to the metadata and text lists, returning the next index."""
    meta: Dict = {
        "paragraph_index": idx,
        "text": text,
        "style_name": "Normal",
        "is_heading": False,
        "char_count": len(text),
    }
    if page_number is not None:
        meta["page_number"] = page_number
    paragraphs_meta.append(meta)
    text_parts.append(text)
    return idx + 1


def _parse_pdf_structured(path: Path) -> Tuple[str, List[Dict]]:
    paragraphs_meta = []
    text_parts = []
    idx = 0

    with pdfplumber.open(str(path)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text or not text.strip():
                logger.warning(f"PDF page {page_num} yielded no extractable text (possibly scanned image).")
                continue

            lines = text.split("\n")
            current_para = []

            for line in lines:
                l_str = line.strip()
                if not l_str:
                    if current_para:
                        p_text = " ".join(current_para)
                        idx = _append_paragraph(paragraphs_meta, text_parts, idx, p_text, page_number=page_num)
                        current_para = []
                else:
                    # If line looks like a heading or new paragraph (e.g. starts with indent or number)
                    # and current_para ends with a period, flush current paragraph
                    if current_para and current_para[-1].endswith((".", ":", ";")) and (l_str[0].isupper() or l_str.startswith(("[", "(", "1", "2", "3", "4", "5", "6", "7", "8", "9"))):
                        p_text = " ".join(current_para)
                        idx = _append_paragraph(paragraphs_meta, text_parts, idx, p_text, page_number=page_num)
                        current_para = [l_str]
                    else:
                        current_para.append(l_str)

            if current_para:
                p_text = " ".join(current_para)
                idx = _append_paragraph(paragraphs_meta, text_parts, idx, p_text, page_number=page_num)

    return "\n\n".join(text_parts), paragraphs_meta


def parse_txt_structured(raw_text: str) -> List[Dict]:
    paragraphs = raw_text.split("\n\n")
    meta = []
    idx = 0
    for p in paragraphs:
        txt = p.strip()
        if txt:
            meta.append({
                "paragraph_index": idx,
                "text": txt,
                "style_name": "Normal",
                "is_heading": False,
                "char_count": len(txt)
            })
            idx += 1
    return meta

