import pytest

from citepilot_ai.services.export_service import (
    generate_pdf_report,
    generate_redline_docx,
    generate_clean_docx,
    _generate_minimal_pdf_bytes,
)


def test_generate_pdf_report_with_xml_special_characters():
    analysis_data = {
        "citations": [{"raw_text": "(Smith & Jones < 2020 >)"}],
        "references": [
            {"raw_entry": "Smith, A. & Jones, B. (2020). Test <Title> & More.", "status": "retracted"}
        ],
        "style_warnings": [
            {"code": "STYLE_ERR", "message": "Missing comma before & character"}
        ],
        "recency": {"within_5_years_percent": 80.0, "within_10_years_percent": 100.0, "average_source_age_years": 2.5}
    }

    pdf_bytes = generate_pdf_report(analysis_data)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 200


def test_minimal_pdf_fallback_bytes():
    lines = ["Line 1 with text", "Line 2 with (parens)"]
    pdf_bytes = _generate_minimal_pdf_bytes("Fallback Report", lines)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert b"%%EOF" in pdf_bytes


def test_generate_redline_docx():
    text = "Paragraph one with (Smith 2020).\n\nParagraph two with references."
    analysis_data = {
        "style_warnings": [
            {"code": "MISSING_COMMA", "message": "Missing comma between author and year", "target_text": "Paragraph one"}
        ],
        "citations": [
            {"raw_text": "(Smith 2020)", "status": "no_match"}
        ]
    }

    docx_bytes = generate_redline_docx(text, analysis_data)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 500


def test_generate_clean_docx():
    text = "# Introduction\n\nThis is the revised manuscript text with accepted fixes.\n\n## Methods\n\nWe evaluated the performance empirically.\n\nReferences\n\nSmith, J. (2020). Example Study."
    docx_bytes = generate_clean_docx(text)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 500
