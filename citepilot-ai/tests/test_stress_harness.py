import asyncio
import io
import time
from unittest.mock import AsyncMock, patch
import pytest
from docx import Document as DocxReader
from docx.enum.text import WD_COLOR_INDEX
from fastapi.testclient import TestClient

from citepilot_ai.main import app
from citepilot_ai.services.crossref_service import (
    _clean_doi,
    validate_reference_with_crossref,
)
from citepilot_ai.services.export_service import (
    generate_pdf_report,
    generate_redline_docx,
)
from citepilot_ai.services.recency_service import calculate_publication_recency
from citepilot_ai.services.uncited_claims_detector import detect_uncited_claims

client = TestClient(app)


# 1. Non-blocking async performance test (<10s response under 20 concurrent requests)
@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.match_citations_to_references", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.validate_reference_with_crossref", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.check_retraction_status", new_callable=AsyncMock)
def test_async_concurrency_performance(
    mock_retraction,
    mock_crossref,
    mock_style,
    mock_match,
    mock_claims,
    mock_parse_refs,
    mock_extract_cites,
):
    async def simulated_extract(*args, **kwargs):
        await asyncio.sleep(0.05)
        return [{"raw_text": "(Smith, 2020)", "paragraph_index": 0}]

    async def simulated_parse(*args, **kwargs):
        await asyncio.sleep(0.05)
        return [{"raw_entry": "Smith, 2020", "position": 1, "parsed_year": 2020}]

    async def simulated_empty(*args, **kwargs):
        await asyncio.sleep(0.02)
        return []

    async def simulated_match(*args, **kwargs):
        await asyncio.sleep(0.02)
        return [{"citation_raw_text": "(Smith, 2020)", "matched_reference_index": 0, "confidence": 0.95, "match_type": "exact"}]

    async def simulated_crossref(*args, **kwargs):
        await asyncio.sleep(0.05)
        return {"crossref_verified": True, "status": "verified"}

    async def simulated_retraction(*args, **kwargs):
        await asyncio.sleep(0.02)
        return {"is_retracted": False, "status": "normal"}

    mock_extract_cites.side_effect = simulated_extract
    mock_parse_refs.side_effect = simulated_parse
    mock_claims.side_effect = simulated_empty
    mock_match.side_effect = simulated_match
    mock_style.side_effect = simulated_empty
    mock_crossref.side_effect = simulated_crossref
    mock_retraction.side_effect = simulated_retraction

    async def run_concurrent_requests():
        start_time = time.monotonic()
        
        async def single_request():
            # Use httpx AsyncClient against FastAPI app via ASGI
            from httpx import ASGITransport, AsyncClient
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post(
                    "/api/v1/analyse",
                    data={
                        "text": "Academic body paragraph with (Smith, 2020).\n\nReferences\nSmith, J. (2020). Test title.",
                        "citation_style": "apa7",
                        "mode": "full"
                    }
                )
                assert res.status_code == 200
                return res.json()

        # Fire 20 concurrent requests
        results = await asyncio.gather(*[single_request() for _ in range(20)])
        duration = time.monotonic() - start_time
        return results, duration

    results, total_duration = asyncio.run(run_concurrent_requests())
    assert len(results) == 20
    assert total_duration < 10.0, f"Concurrent requests took {total_duration:.2f}s, exceeding 10s budget."


# 2. Clean DOI parsing for DOIs ending in trailing periods
def test_clean_doi_trailing_periods():
    doi_variants = [
        ("10.1016/j.cell.2020.01.001.", "10.1016/j.cell.2020.01.001"),
        ("10.1016/j.cell.2020.01.001...", "10.1016/j.cell.2020.01.001"),
        ("https://doi.org/10.1016/j.cell.2020.01.001.", "10.1016/j.cell.2020.01.001"),
        ("http://dx.doi.org/10.1016/j.cell.2020.01.001.,;", "10.1016/j.cell.2020.01.001"),
        ("(10.1016/j.cell.2020.01.001)", "10.1016/j.cell.2020.01.001"),
    ]
    for raw_doi, expected in doi_variants:
        cleaned = _clean_doi(raw_doi)
        assert cleaned == expected, f"Failed for '{raw_doi}': expected '{expected}', got '{cleaned}'"


def test_crossref_validation_handles_trailing_period_doi():
    async def _test():
        ref_entry = {
            "parsed_doi": "10.1016/j.cell.2020.01.001.",
            "parsed_title": "Sample Cell Article",
            "parsed_year": 2020
        }
        mock_work = {
            "DOI": "10.1016/j.cell.2020.01.001",
            "title": ["Sample Cell Article"],
            "container-title": ["Cell"],
            "published-print": {"date-parts": [[2020, 1, 15]]}
        }
        with patch("citepilot_ai.services.crossref_service._fetch_by_doi", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_work
            res = await validate_reference_with_crossref(ref_entry)
            mock_fetch.assert_called_once_with("10.1016/j.cell.2020.01.001")
            assert res["crossref_verified"] is True
            assert res["status"] == "verified"
            assert len(res["discrepancies"]) == 0

    asyncio.run(_test())


# 3. Publication recency calculation with string years vs integer years
def test_recency_calculation_string_vs_int_years():
    refs_string = [
        {"parsed_year": "2024"},
        {"parsed_year": "2022"},
        {"parsed_year": "2019"},
        {"parsed_year": "2012"},
        {"parsed_year": "invalid"},
    ]
    refs_int = [
        {"parsed_year": 2024},
        {"parsed_year": 2022},
        {"parsed_year": 2019},
        {"parsed_year": 2012},
        {"parsed_year": None},
    ]

    res_str = calculate_publication_recency(refs_string)
    res_int = calculate_publication_recency(refs_int)

    assert res_str["total_parsed_sources"] == res_int["total_parsed_sources"]
    assert res_str["valid_year_sources"] == res_int["valid_year_sources"]
    assert res_str["within_3_years_count"] == res_int["within_3_years_count"]
    assert res_str["within_5_years_count"] == res_int["within_5_years_count"]
    assert res_str["within_10_years_count"] == res_int["within_10_years_count"]
    assert res_str["older_than_10_years_count"] == res_int["older_than_10_years_count"]
    assert res_str["average_publication_year"] == res_int["average_publication_year"]
    assert res_str["average_source_age_years"] == res_int["average_source_age_years"]
    assert res_str["recency_compliance_status"] == res_int["recency_compliance_status"]


# 4. Uncited claims detection across manuscripts exceeding 60 paragraphs
def test_uncited_claims_detection_exceeding_60_paragraphs():
    async def _test():
        total_paragraphs = 75
        paras_meta = [
            {"paragraph_index": i, "text": f"Paragraph {i}: Factual statement regarding empirical experiment iteration {i}."}
            for i in range(total_paragraphs)
        ]
        body_text = "\n\n".join([p["text"] for p in paras_meta])

        # Simulate finding an uncited claim in paragraph 68
        mock_ai_json = '{"uncited_claims": [{"paragraph_index": 68, "claim_text": "Paragraph 68: Factual statement", "reason": "Missing citation", "severity": "warning"}]}'

        with patch("citepilot_ai.services.uncited_claims_detector.async_call_gemini", new_callable=AsyncMock) as mock_ai:
            mock_ai.return_value = mock_ai_json
            result = await detect_uncited_claims(body_text, paras_meta)
            assert len(result) == 1
            assert result[0]["paragraph_index"] == 68
            assert result[0]["code"] == "UNCITED_FACTUAL_CLAIM"
            assert "Paragraph 68" in result[0]["claim_text"]
            
            # Verify AI was called with truncated or complete payload representing all 75 paragraphs
            called_prompt = mock_ai.call_args[0][0]
            assert "Paragraph 74" in called_prompt or "paragraph_index\": 74" in called_prompt or "TRUNCATED" in called_prompt

    asyncio.run(_test())


# 5. PDF export generation with XML special characters (<, >, &) in style warnings
def test_pdf_export_xml_special_characters_escaping():
    analysis_data = {
        "citations": [{"raw_text": "(Smith & Jones < 2020 >)"}],
        "references": [
            {"raw_entry": "Smith, A. & Jones, B. <2020>. Title & Test.", "status": "retracted"}
        ],
        "style_warnings": [
            {
                "code": "FORMAT_<ERR>&_STYLE",
                "message": "Comparison <A & B> requires & escaping instead of raw < & > tags",
                "target_text": "<tag_target>"
            },
            {
                "code": "AMPERSAND_TEST",
                "message": "Use &amp; symbol in (Alpha & Beta > Gamma)",
                "target_text": "&test"
            }
        ],
        "recency": {
            "within_5_years_percent": 75.5,
            "within_10_years_percent": 95.0,
            "average_source_age_years": 3.2
        }
    }

    # Must complete without throwing xml.parsers.expat.ExpatError or ReportLab parsing exception
    pdf_bytes = generate_pdf_report(analysis_data)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 500


# 6. DOCX redline export highlights and comments
def test_docx_redline_export_highlights_and_comments():
    text = (
        "First paragraph without issues.\n\n"
        "Second paragraph with (Smith 2020) containing a missing comma violation.\n\n"
        "Third paragraph with clean citation (Jones, 2021)."
    )
    analysis_data = {
        "style_warnings": [
            {
                "code": "MISSING_COMMA",
                "message": "Missing comma between author surname and publication year.",
                "target_text": "(Smith 2020)"
            }
        ],
        "citations": [
            {"raw_text": "(Smith 2020)", "status": "no_match"},
            {"raw_text": "(Jones, 2021)", "status": "matched"}
        ],
        "uncited_claims": []
    }

    docx_bytes = generate_redline_docx(text, analysis_data)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 500

    # Parse generated docx bytes to verify XML elements and highlight runs
    doc = DocxReader(io.BytesIO(docx_bytes))
    paragraphs = doc.paragraphs
    assert len(paragraphs) >= 4  # Title + summary + header + manuscript paragraphs

    # Locate paragraph containing the warning target
    flagged_para = None
    for p in paragraphs:
        if "(Smith 2020)" in p.text:
            flagged_para = p
            break

    assert flagged_para is not None, "Paragraph containing (Smith 2020) not found in DOCX"

    # Check runs in flagged paragraph
    highlighted_text_run = None
    comment_run = None
    for run in flagged_para.runs:
        if run.font.highlight_color == WD_COLOR_INDEX.YELLOW:
            highlighted_text_run = run
        elif run.font.highlight_color == WD_COLOR_INDEX.PINK:
            comment_run = run

    assert highlighted_text_run is not None, "Yellow highlight run not found for flagged paragraph"
    assert comment_run is not None, "Pink comment run not found for style warning"
    assert "[STYLE WARNING (MISSING_COMMA):" in comment_run.text
    assert comment_run.bold is True
