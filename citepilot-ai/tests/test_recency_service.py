from datetime import datetime
import pytest

from citepilot_ai.services.recency_service import calculate_publication_recency


def test_recency_service_string_years():
    refs = [
        {"parsed_year": "2024"},
        {"parsed_year": "2023"},
        {"parsed_year": 2022},
        {"parsed_year": "invalid_year"},
    ]
    res = calculate_publication_recency(refs)
    assert res["total_parsed_sources"] == 4
    assert res["valid_year_sources"] == 3
    assert res["within_5_years_count"] == 3
    # 3 valid out of 4 total parsed sources = 75.0%
    assert res["within_5_years_percent"] == 75.0


def test_recency_service_empty_input():
    res = calculate_publication_recency([])
    assert res["total_parsed_sources"] == 0
    assert res["valid_year_sources"] == 0
    assert res["within_5_years_percent"] == 0.0
    assert res["recency_compliance_status"] == "insufficient_data"


def test_recency_service_percentage_against_total_references():
    current_year = datetime.now().year
    # 10 references, only 1 recent year
    refs = [{"parsed_year": current_year}] + [{"parsed_year": None} for _ in range(9)]
    res = calculate_publication_recency(refs)
    assert res["total_parsed_sources"] == 10
    assert res["valid_year_sources"] == 1
    assert res["within_5_years_count"] == 1
    # 1 out of 10 total = 10.0%
    assert res["within_5_years_percent"] == 10.0
    assert res["recency_compliance_status"] == "dated_sources_warning"
