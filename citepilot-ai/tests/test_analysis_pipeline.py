import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from citepilot_ai.services.analysis_pipeline import (
    _build_citation_results,
    _build_reference_results,
    _verify_references,
    run_analysis_pipeline,
)


def _ref(**overrides):
    ref = {
        "raw_entry": "Smith, J. (2020). Example title. Journal of Testing, 1(1), 1-10.",
        "position": 1,
        "parsed_authors": [],
        "parsed_year": 2020,
        "parsed_title": "Example title",
        "parsed_doi": "10.1000/example",
        "parsed_journal": "Journal of Testing",
    }
    ref.update(overrides)
    return ref


class TestBuildCitationResults:
    def test_matched_and_unmatched_citations(self):
        citations = [
            {"raw_text": "(Smith, 2020)", "paragraph_index": 0, "char_start": 0, "char_end": 12},
            {"raw_text": "(Jones et al., 2019)", "paragraph_index": 1, "char_start": 5, "char_end": 22},
        ]
        matches = [
            {
                # Whitespace/case differs from the citation; keys must normalize.
                "citation_raw_text": "(smith,  2020)",
                "matched_reference_index": 2,
                "confidence": 0.95,
                "match_type": "exact",
                "issues": [],
            }
        ]
        results = _build_citation_results(citations, matches)

        assert results[0]["status"] == "matched"
        assert results[0]["matched_reference_index"] == 2
        assert results[0]["confidence"] == 0.95
        assert results[0]["match_type"] == "exact"
        assert results[0]["issues"] == []

        assert results[1]["status"] == "no_match"
        assert results[1]["matched_reference_index"] is None
        assert results[1]["confidence"] == 0.0
        assert results[1]["match_type"] == "none"

    def test_matched_reference_index_string_is_parsed(self):
        citations = [{"raw_text": "(Smith, 2020)"}]
        matches = [{"citation_raw_text": "(Smith, 2020)", "matched_reference_index": "3", "confidence": 0.5}]
        results = _build_citation_results(citations, matches)
        assert results[0]["matched_reference_index"] == 3
        assert results[0]["status"] == "matched"

    def test_invalid_reference_index_is_ignored(self):
        citations = [{"raw_text": "(Smith, 2020)"}]
        matches = [{"citation_raw_text": "(Smith, 2020)", "matched_reference_index": "not-an-int"}]
        results = _build_citation_results(citations, matches)
        assert results[0]["status"] == "no_match"
        assert results[0]["matched_reference_index"] is None

    def test_defaults_applied_when_fields_missing(self):
        results = _build_citation_results([{"raw_text": "X"}], [])
        assert results[0]["paragraph_index"] == 0
        assert results[0]["char_start"] == 0
        assert results[0]["citation_type"] == "parenthetical"
        assert results[0]["extracted_authors"] == []
        assert results[0]["issues"] == []


class TestBuildReferenceResults:
    def test_cited_retracted_and_orphaned_statuses(self):
        refs = [_ref(), _ref(), _ref()]
        citation_results = [
            {"matched_reference_index": 0},
            {"matched_reference_index": None},  # no-match citations are ignored
        ]
        retraction_results = [
            {"is_retracted": False},
            {"is_retracted": True},
            {"is_retracted": False},
        ]
        results = _build_reference_results(
            refs, citation_results, [{}, {}, {}], [{}, {}, {}], retraction_results
        )
        assert results[0]["status"] == "cited"
        assert results[1]["status"] == "retracted"
        assert results[2]["status"] == "orphaned"

    def test_raw_work_stripped_from_crossref_validation(self):
        refs = [_ref()]
        crossref_results = [{"crossref_verified": True, "status": "verified", "raw_work": {"DOI": "10.1000/x"}}]
        results = _build_reference_results(refs, [], crossref_results, [{}], [{}])
        assert "raw_work" not in results[0]["crossref_validation"]
        assert results[0]["crossref_validation"]["crossref_verified"] is True

    def test_openalex_fallback_merged_when_crossref_unverified(self):
        refs = [_ref()]
        crossref_results = [{"crossref_verified": False, "status": "not_found"}]
        openalex_results = [{
            "verified": True,
            "canonical_title": "Canonical OA Title",
            "canonical_doi": "10.2000/canonical",
            "discrepancies": [{"field": "year"}],
        }]
        results = _build_reference_results(refs, [], crossref_results, openalex_results, [{}])
        cr = results[0]["crossref_validation"]
        assert cr["crossref_verified"] is True
        assert cr["provider"] == "openalex"
        assert cr["canonical_title"] == "Canonical OA Title"
        assert cr["canonical_doi"] == "10.2000/canonical"
        assert cr["discrepancies"] == [{"field": "year"}]

    def test_openalex_not_applied_when_crossref_verified(self):
        refs = [_ref()]
        crossref_results = [{"crossref_verified": True, "status": "verified"}]
        openalex_results = [{"verified": True, "canonical_title": "Should Not Apply"}]
        results = _build_reference_results(refs, [], crossref_results, openalex_results, [{}])
        cr = results[0]["crossref_validation"]
        assert "provider" not in cr
        assert "canonical_title" not in cr

    def test_openalex_retraction_marks_status(self):
        refs = [_ref()]
        results = _build_reference_results(
            refs, [], [{}], [{"is_retracted": True}], [{"is_retracted": False}]
        )
        assert results[0]["status"] == "retracted"

    def test_position_defaults_to_index_plus_one(self):
        refs = [
            {k: v for k, v in _ref().items() if k != "position"},
            {k: v for k, v in _ref().items() if k != "position"},
        ]
        results = _build_reference_results(refs, [], [{}, {}], [{}, {}], [{}, {}])
        assert results[0]["position"] == 1
        assert results[1]["position"] == 2


class TestVerifyReferences:
    def test_openalex_only_called_for_unverified_refs_with_identifier(self):
        refs = [
            {"parsed_doi": "10.1/x", "parsed_title": "T1"},  # crossref verified -> skip OpenAlex
            {"parsed_doi": "10.2/y", "parsed_title": "T2"},  # unverified -> OpenAlex (doi)
            {"parsed_title": "T3"},                          # unverified -> OpenAlex (title)
            {"parsed_year": 2020},                           # unverified, no identifier -> skip
        ]
        crossref_results = [
            {"crossref_verified": True},
            {"crossref_verified": False},
            {"crossref_verified": False},
            {"crossref_verified": False},
        ]

        async def _test():
            with (
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_crossref",
                    new_callable=AsyncMock,
                    side_effect=crossref_results,
                ),
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_openalex",
                    new_callable=AsyncMock,
                    return_value={"verified": True},
                ) as mock_oa,
                patch(
                    "citepilot_ai.services.analysis_pipeline.check_retraction_status",
                    new_callable=AsyncMock,
                    return_value={"is_retracted": False},
                ) as mock_ret,
            ):
                cr_res, oa_res, ret_res = await _verify_references(refs)

            assert mock_oa.await_count == 2
            assert mock_ret.await_count == 4
            assert len(cr_res) == len(oa_res) == len(ret_res) == 4
            assert cr_res[0]["crossref_verified"] is True

        asyncio.run(_test())

    def test_per_reference_exceptions_swallowed(self):
        refs = [{"parsed_doi": "10.1/x"}]

        async def _test():
            with (
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_crossref",
                    new_callable=AsyncMock,
                    side_effect=RuntimeError("boom"),
                ),
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_openalex",
                    new_callable=AsyncMock,
                    return_value={"verified": True},
                ) as mock_oa,
                patch(
                    "citepilot_ai.services.analysis_pipeline.check_retraction_status",
                    new_callable=AsyncMock,
                    return_value={},
                ),
            ):
                cr_res, oa_res, _ = await _verify_references(refs)

            assert cr_res == [{}]
            assert mock_oa.await_count == 1  # fallback still attempted for unverified ref

        asyncio.run(_test())


class TestRunAnalysisPipeline:
    def test_full_flow(self):
        async def _test():
            with (
                patch(
                    "citepilot_ai.services.analysis_pipeline.extract_citations",
                    new_callable=AsyncMock,
                    return_value=[{"raw_text": "(Smith, 2020)", "paragraph_index": 0}],
                ) as mock_extract,
                patch(
                    "citepilot_ai.services.analysis_pipeline.parse_references",
                    new_callable=AsyncMock,
                    return_value=[_ref()],
                ) as mock_parse,
                patch(
                    "citepilot_ai.services.analysis_pipeline.detect_uncited_claims",
                    new_callable=AsyncMock,
                    return_value=[],
                ) as mock_claims,
                patch(
                    "citepilot_ai.services.analysis_pipeline.match_citations_to_references",
                    new_callable=AsyncMock,
                    return_value=[{
                        "citation_raw_text": "(Smith, 2020)",
                        "matched_reference_index": 0,
                        "confidence": 0.9,
                        "match_type": "exact",
                    }],
                ) as mock_match,
                patch(
                    "citepilot_ai.services.analysis_pipeline.check_style",
                    new_callable=AsyncMock,
                    return_value=[],
                ) as mock_style,
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_crossref",
                    new_callable=AsyncMock,
                    return_value={"crossref_verified": True, "status": "verified", "raw_work": {"DOI": "10.1000/x"}},
                ) as mock_cr,
                patch(
                    "citepilot_ai.services.analysis_pipeline.validate_reference_with_openalex",
                    new_callable=AsyncMock,
                    return_value={},
                ) as mock_oa,
                patch(
                    "citepilot_ai.services.analysis_pipeline.check_retraction_status",
                    new_callable=AsyncMock,
                    return_value={"is_retracted": False},
                ) as mock_ret,
            ):
                result = await run_analysis_pipeline("body text", "refs", [], "apa7")

            assert result["citations"][0]["status"] == "matched"
            assert result["citations"][0]["matched_reference_index"] == 0
            assert result["references"][0]["status"] == "cited"
            assert "raw_work" not in result["references"][0]["crossref_validation"]
            assert result["matches"][0]["match_type"] == "exact"
            assert result["style_warnings"] == []
            assert result["uncited_claims"] == []
            assert result["recency"]["total_parsed_sources"] == 1

            mock_extract.assert_awaited_once()
            mock_parse.assert_awaited_once()
            mock_claims.assert_awaited_once()
            mock_match.assert_awaited_once()
            mock_style.assert_awaited_once()
            mock_cr.assert_awaited_once()
            mock_oa.assert_not_awaited()  # Crossref verified -> no OpenAlex fallback
            mock_ret.assert_awaited_once()

        asyncio.run(_test())

    def test_empty_input_skips_all_ai_calls(self):
        async def _test():
            with (
                patch("citepilot_ai.services.analysis_pipeline.extract_citations", new_callable=AsyncMock) as mock_extract,
                patch("citepilot_ai.services.analysis_pipeline.parse_references", new_callable=AsyncMock) as mock_parse,
                patch("citepilot_ai.services.analysis_pipeline.detect_uncited_claims", new_callable=AsyncMock) as mock_claims,
                patch("citepilot_ai.services.analysis_pipeline.check_style", new_callable=AsyncMock) as mock_style,
                patch("citepilot_ai.services.analysis_pipeline.match_citations_to_references", new_callable=AsyncMock) as mock_match,
                patch("citepilot_ai.services.analysis_pipeline.validate_reference_with_crossref", new_callable=AsyncMock) as mock_cr,
            ):
                result = await run_analysis_pipeline("", "", [], "apa7")

            mock_extract.assert_not_awaited()
            mock_parse.assert_not_awaited()
            mock_claims.assert_not_awaited()
            mock_style.assert_not_awaited()
            mock_match.assert_not_awaited()
            mock_cr.assert_not_awaited()
            assert result["citations"] == []
            assert result["references"] == []
            assert result["matches"] == []
            assert result["recency"]["total_parsed_sources"] == 0

        asyncio.run(_test())

    def test_reraises_first_extraction_exception(self):
        async def _test():
            with (
                patch(
                    "citepilot_ai.services.analysis_pipeline.extract_citations",
                    new_callable=AsyncMock,
                    side_effect=RuntimeError("boom"),
                ),
                patch("citepilot_ai.services.analysis_pipeline.parse_references", new_callable=AsyncMock),
            ):
                with pytest.raises(RuntimeError, match="boom"):
                    await run_analysis_pipeline("body", "refs", [], "apa7")

        asyncio.run(_test())
