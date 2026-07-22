import pytest
from citepilot_ai.services.llm import parse_and_validate_ai_response, extract_json
from citepilot_ai.models.schemas import (
    CitationsResponseSchema,
    ReferencesResponseSchema,
    MatchesResponseSchema,
    StyleWarningsResponseSchema,
    UncitedClaimsResponseSchema,
    ExtractedCitationItem,
)


def test_extract_json_valid_and_markdown():
    raw_json = '{"key": "value"}'
    assert extract_json(raw_json) == {"key": "value"}

    markdown_json = '```json\n{"key": "value"}\n```'
    assert extract_json(markdown_json) == {"key": "value"}

    embedded_json = 'Some prefix text {"key": "value"} suffix text'
    assert extract_json(embedded_json) == {"key": "value"}

    invalid_text = 'Not a json string at all'
    assert extract_json(invalid_text) == {}


def test_validate_citations_schema_success():
    raw_json = '''{
        "citations": [
            {
                "raw_text": "(Smith, 2024)",
                "paragraph_index": 2,
                "char_start": 10,
                "char_end": 23,
                "context": "as reported by (Smith, 2024) in the study",
                "extracted_authors": ["Smith"],
                "extracted_year": 2024,
                "citation_type": "parenthetical"
            }
        ]
    }'''
    res = parse_and_validate_ai_response(raw_json, CitationsResponseSchema)
    assert isinstance(res, CitationsResponseSchema)
    assert len(res.citations) == 1
    assert res.citations[0].raw_text == "(Smith, 2024)"
    assert res.citations[0].extracted_year == 2024
    assert res.citations[0].extracted_authors == ["Smith"]


def test_validate_citations_schema_partial_fields():
    raw_json = '''{
        "citations": [
            {
                "raw_text": "[1]"
            }
        ]
    }'''
    res = parse_and_validate_ai_response(raw_json, CitationsResponseSchema)
    assert len(res.citations) == 1
    assert res.citations[0].raw_text == "[1]"
    assert res.citations[0].paragraph_index == 0
    assert res.citations[0].citation_type == "parenthetical"


def test_validate_references_schema():
    raw_json = '''{
        "references": [
            {
                "raw_entry": "Smith, J. (2024). Test Article. Journal of Testing, 1(1), 1-10.",
                "position": 1,
                "parsed_authors": [{"family": "Smith", "given": "J."}],
                "parsed_year": 2024,
                "parsed_title": "Test Article",
                "reference_type": "journal_article"
            }
        ]
    }'''
    res = parse_and_validate_ai_response(raw_json, ReferencesResponseSchema)
    assert len(res.references) == 1
    assert res.references[0].parsed_title == "Test Article"
    assert res.references[0].parsed_year == 2024


def test_validate_matches_schema():
    raw_json = '''{
        "matches": [
            {
                "citation_raw_text": "(Smith, 2024)",
                "matched_reference_index": 0,
                "match_type": "exact",
                "confidence": 0.98
            }
        ]
    }'''
    res = parse_and_validate_ai_response(raw_json, MatchesResponseSchema)
    assert len(res.matches) == 1
    assert res.matches[0].confidence == 0.98
    assert res.matches[0].match_type == "exact"


def test_validate_uncited_claims_schema():
    raw_json = '''{
        "uncited_claims": [
            {
                "paragraph_index": 3,
                "claim_text": "85% of subjects reported positive outcomes.",
                "reason": "Uncited empirical statistic."
            }
        ]
    }'''
    res = parse_and_validate_ai_response(raw_json, UncitedClaimsResponseSchema)
    assert len(res.uncited_claims) == 1
    assert res.uncited_claims[0].paragraph_index == 3
    assert res.uncited_claims[0].claim_text == "85% of subjects reported positive outcomes."


def test_validate_malformed_json_fallback():
    raw_invalid = 'Random unstructured text from broken LLM response'
    res = parse_and_validate_ai_response(raw_invalid, StyleWarningsResponseSchema)
    assert isinstance(res, StyleWarningsResponseSchema)
    assert res.style_warnings == []
