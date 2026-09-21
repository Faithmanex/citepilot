"""Offline tests for the Jev decision layer (ADR-012).

All tests run without network and without TYPESAFE_API_KEY — the service
must fail open / no-op when disabled.
"""

import asyncio
from unittest.mock import AsyncMock, patch

from citepilot_ai.services import jev_service
from citepilot_ai.services.analysis_pipeline import _build_citation_results


def _run(coro):
    return asyncio.run(coro)


class TestJevDisabledByDefault:
    def test_verify_returns_disabled_without_key(self):
        with patch.object(jev_service.settings, "typesafe_api_key", ""), patch.object(
            jev_service.settings, "typesafe_enabled", True
        ):
            assert jev_service.is_jev_enabled() is False
            res = _run(jev_service.verify_citation_relation("claim", "section"))
            assert res["enabled"] is False
            assert res["verdict"] is None

    def test_enrich_is_noop_when_disabled(self):
        matches = [{"citation_raw_text": "(Smith, 2020)", "matched_reference_index": 0}]
        refs = [{"raw_entry": "Smith, J. (2020). Title. Journal."}]
        with patch.object(jev_service.settings, "typesafe_api_key", ""):
            out = _run(jev_service.enrich_matches_with_jev(matches, [{"raw_text": "x"}], refs))
            assert out == matches  # unchanged, no network

    def test_empty_claim_or_section_short_circuits(self):
        with patch.object(jev_service.settings, "typesafe_api_key", "dummy"), patch.object(
            jev_service.settings, "typesafe_enabled", True
        ):
            res = _run(jev_service.verify_citation_relation("", "section"))
            assert res["verdict"] is None
            assert res["error"] == "empty claim or section"


class TestJevVerdictMapping:
    def test_build_question_payload_shape(self):
        payload = jev_service.build_jev_question_payload()
        assert payload["relation"]["type"] == "choice"
        assert set(payload["relation"]["criteria"]) == {"supports", "contradicts", "says_nothing"}

    def test_verdict_mapping_and_threshold(self):
        with patch.object(jev_service.settings, "typesafe_auto_accept", 0.8):
            assert jev_service._verdict_from_choice("supports", 0.95) == {
                "verdict": "verified",
                "confidence": 0.95,
                "auto": True,
            }
            low = jev_service._verdict_from_choice("says_nothing", 0.27)
            assert low["verdict"] == "unsupported"
            assert low["auto"] is False
            assert jev_service._verdict_from_choice("contradicts", 0.99)["verdict"] == "contradicted"


class TestJevEnrichmentMocked:
    def test_enrich_attaches_verdict_on_mocked_verify(self):
        matches = [{"citation_raw_text": "(Smith, 2020)", "matched_reference_index": 0}]
        refs = [{"raw_entry": "Smith, J. (2020). Title. Journal."}]
        fake = {
            "enabled": True,
            "verdict": "verified",
            "choice": "supports",
            "confidence": 0.93,
            "probabilities": {"supports": 0.93},
            "auto": True,
            "model": "jev-latest",
            "error": None,
        }
        with (
            patch.object(jev_service.settings, "typesafe_api_key", "dummy"),
            patch.object(jev_service.settings, "typesafe_enabled", True),
            patch(
                "citepilot_ai.services.jev_service.verify_citation_relation",
                new_callable=AsyncMock,
                return_value=fake,
            ),
        ):
            out = _run(jev_service.enrich_matches_with_jev(matches, [], refs))
            assert out[0]["jev_verdict"] == "verified"
            assert out[0]["jev_confidence"] == 0.93
            assert out[0]["jev_auto"] is True

    def test_enrich_skips_unmatched(self):
        matches = [{"citation_raw_text": "(Nobody, 1999)", "matched_reference_index": None}]
        with (
            patch.object(jev_service.settings, "typesafe_api_key", "dummy"),
            patch.object(jev_service.settings, "typesafe_enabled", True),
            patch(
                "citepilot_ai.services.jev_service.verify_citation_relation",
                new_callable=AsyncMock,
            ) as mock_verify,
        ):
            out = _run(jev_service.enrich_matches_with_jev(matches, [], []))
            assert out == matches
            mock_verify.assert_not_awaited()


class TestCitationResultsCarryJev:
    def test_jev_fields_default_to_none(self):
        results = _build_citation_results([{"raw_text": "(Smith, 2020)"}], [])
        assert results[0]["jev_verdict"] is None
        assert results[0]["jev_confidence"] is None
        assert results[0]["jev_auto"] is None

    def test_jev_fields_propagated_from_match(self):
        citations = [{"raw_text": "(Smith, 2020)"}]
        matches = [{
            "citation_raw_text": "(Smith, 2020)",
            "matched_reference_index": 0,
            "confidence": 0.9,
            "match_type": "exact",
            "jev_verdict": "verified",
            "jev_choice": "supports",
            "jev_confidence": 0.93,
            "jev_auto": True,
        }]
        results = _build_citation_results(citations, matches)
        assert results[0]["jev_verdict"] == "verified"
        assert results[0]["jev_confidence"] == 0.93
        assert results[0]["jev_auto"] is True
