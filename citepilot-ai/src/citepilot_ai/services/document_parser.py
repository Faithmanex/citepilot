import io
import logging
from pathlib import Path
from typing import Optional

import pdfplumber
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


def parse_document(file_path: str, mime_type: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _parse_docx(path)
    elif mime_type == "application/pdf":
        return _parse_pdf(path)
    elif mime_type == "text/plain":
        return path.read_text(encoding="utf-8")
    else:
        raise ValueError(f"Unsupported mime type: {mime_type}")


def _parse_docx(path: Path) -> str:
    doc = DocxDocument(str(path))
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def _parse_pdf(path: Path) -> str:
    text_parts = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text and text.strip():
                text_parts.append(text.strip())
    return "\n\n".join(text_parts)
