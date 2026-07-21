import pytest
from citepilot_ai.services.document_parser import (
    split_body_and_references,
    parse_document,
    _parse_txt_structured,
)


def test_split_body_and_references_various_headings():
    # Case 1: Standard References
    text1 = "Body paragraph 1.\n\nReferences\n1. Smith 2020."
    b1, r1 = split_body_and_references(text1)
    assert "Body paragraph 1." in b1
    assert "Smith 2020." in r1

    # Case 2: "References:" with colon
    text2 = "Body paragraph 2.\n\nReferences:\nSmith (2020) Title."
    b2, r2 = split_body_and_references(text2)
    assert "Body paragraph 2." in b2
    assert "Smith (2020)" in r2

    # Case 3: "10. References" with numbering
    text3 = "Body text.\n\n10. References\nDoe, J. (2021)."
    b3, r3 = split_body_and_references(text3)
    assert "Body text." in b3
    assert "Doe, J. (2021)." in r3

    # Case 4: "Chapter 8: References"
    text4 = "Manuscript content.\n\nChapter 8: References\nJones, A. (2019)."
    b4, r4 = split_body_and_references(text4)
    assert "Manuscript content." in b4
    assert "Jones, A. (2019)." in r4

    # Case 5: "Bibliography"
    text5 = "Text here.\n\nBIBLIOGRAPHY\nBrown, C. (2018)."
    b5, r5 = split_body_and_references(text5)
    assert "Text here." in b5
    assert "Brown, C. (2018)." in r5


def test_parse_document_missing_file():
    with pytest.raises(FileNotFoundError):
        parse_document("nonexistent_file_path.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


def test_parse_document_txt_modes(tmp_path):
    txt_file = tmp_path / "sample.txt"
    content = "First paragraph.\n\nReferences\nSmith (2020). Book Title."
    txt_file.write_text(content, encoding="utf-8")

    # Mode: full
    b_full, r_full, meta_full = parse_document(str(txt_file), "text/plain", mode="full")
    assert "First paragraph." in b_full
    assert "Smith (2020)" in r_full
    assert len(meta_full) == 2

    # Mode: reference_only
    b_ref, r_ref, meta_ref = parse_document(str(txt_file), "text/plain", mode="reference_only")
    assert b_ref == ""
    assert "First paragraph." in r_ref
    assert len(meta_ref) == 2
