from datetime import datetime
import pytest
from citepilot_ai.services.document_parser import split_body_and_references
from citepilot_ai.services.recency_service import calculate_publication_recency
from citepilot_ai.services.retraction_service import _analyze_crossref_retraction, check_retraction_status


def test_split_body_and_references():
    sample_doc = """
Introduction
This research explores deep learning in citation parsing (Smith, 2020).

References
Smith, J. (2020). Machine learning in citation extraction. Journal of AI, 12(3), 45-60.
    """
    body, refs = split_body_and_references(sample_doc)
    assert "Introduction" in body
    assert "Smith, J. (2020)" in refs


def test_calculate_publication_recency():
    current_year = datetime.now().year
    sample_refs = [
        {"parsed_year": current_year},
        {"parsed_year": current_year - 1},
        {"parsed_year": current_year - 2},
        {"parsed_year": current_year - 6},
        {"parsed_year": current_year - 12},
    ]
    res = calculate_publication_recency(sample_refs)
    assert res["total_parsed_sources"] == 5
    assert res["valid_year_sources"] == 5
    assert res["within_5_years_count"] == 3
    assert res["within_5_years_percent"] == 60.0
    assert res["recency_compliance_status"] == "highly_recent"


def test_analyze_crossref_retraction():
    retracted_work = {
        "relation": {
            "is-retracted-by": [{"id": "10.1016/j.cell.2023.001"}]
        },
        "title": ["Gene editing mechanism in somatic cells"]
    }
    info = _analyze_crossref_retraction(retracted_work)
    assert info["is_retracted"] is True
    assert info["status"] == "retracted"
    assert info["severity"] == "red"
