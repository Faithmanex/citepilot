import asyncio
from unittest.mock import AsyncMock, patch
import pytest

from citepilot_ai.services.crossref_service import (
    _clean_doi,
    _fuzzy_title_match,
    validate_reference_with_crossref,
)


def test_clean_doi_cleaning():
    assert _clean_doi("10.1016/j.cell.2020.01.001.") == "10.1016/j.cell.2020.01.001"
    assert _clean_doi("https://doi.org/10.1038/s41586-021-03819-2)") == "10.1038/s41586-021-03819-2"
    assert _clean_doi("http://dx.doi.org/10.1000/182;") == "10.1000/182"
    assert _clean_doi("10.1000/123456") == "10.1000/123456"


def test_fuzzy_title_match():
    t1 = "Deep Learning Methods in Citation Analysis and Verification"
    t2 = "Deep Learning Methods in Citation Analysis & Verification"
    assert _fuzzy_title_match(t1, t2) is True

    t3 = "Quantum Computing Foundations"
    assert _fuzzy_title_match(t1, t3) is False


def test_validate_reference_with_crossref_doi_match():
    async def _test():
        ref_entry = {
            "parsed_doi": "10.1000/123",
            "parsed_title": "Deep Learning Methods",
            "parsed_year": 2020
        }
        mock_work = {
            "DOI": "10.1000/123",
            "title": ["Deep Learning Methods"],
            "container-title": ["Journal of AI Studies"],
            "published-print": {"date-parts": [[2020, 5, 1]]}
        }

        with patch("citepilot_ai.services.crossref_service._fetch_by_doi", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_work
            res = await validate_reference_with_crossref(ref_entry)
            assert res["crossref_verified"] is True
            assert res["status"] == "verified"
            assert res["crossref_doi"] == "10.1000/123"
            assert res["crossref_journal"] == "Journal of AI Studies"
            assert len(res["discrepancies"]) == 0

    asyncio.run(_test())


def test_validate_reference_with_crossref_discrepancies():
    async def _test():
        ref_entry = {
            "parsed_doi": "10.1000/123",
            "parsed_title": "Wrong Article Title",
            "parsed_year": 2018
        }
        mock_work = {
            "DOI": "10.1000/123",
            "title": ["Official Correct Article Title"],
            "published-print": {"date-parts": [[2020, 1, 1]]}
        }

        with patch("citepilot_ai.services.crossref_service._fetch_by_doi", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_work
            res = await validate_reference_with_crossref(ref_entry)
            assert res["crossref_verified"] is True
            assert res["status"] == "discrepancies_found"
            assert len(res["discrepancies"]) >= 1

    asyncio.run(_test())
