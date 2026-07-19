"""Integration tests — calls real Gemini API. Requires GOOGLE_API_KEY env var."""
import pytest
import os
import json

from main import call_gemini, extract_json, analyze_document, SYSTEM_PROMPTS

pytestmark = pytest.mark.skipif(
    not os.environ.get("GOOGLE_API_KEY"),
    reason="GOOGLE_API_KEY not set",
)

class TestGeminiIntegration:
    def test_call_gemini_returns_valid_json(self):
        result = call_gemini("Say hi in JSON: {\"greeting\": \"hello\"}", "Reply with valid JSON only.", os.environ["GOOGLE_API_KEY"])
        assert isinstance(result, dict)
        assert "greeting" in result

    def test_extract_citations_real(self):
        text = "Recent studies show that Smith (2020) found significant results. However, Jones et al. (2019) disagreed."
        result = call_gemini(
            f"Extract citations from this text:\n\n{text}",
            SYSTEM_PROMPTS["citations"],
            os.environ["GOOGLE_API_KEY"],
        )
        assert "citations" in result
        assert len(result["citations"]) >= 2

    def test_parse_references_real(self):
        refs_text = "Smith, J. (2020). The title of the paper. Journal of Examples, 15(2), 123-145."
        result = call_gemini(
            f"Parse these references:\n\n{refs_text}",
            SYSTEM_PROMPTS["references"],
            os.environ["GOOGLE_API_KEY"],
        )
        assert "references" in result
        assert len(result["references"]) >= 1
        entry = result["references"][0]
        assert "raw_entry" in entry
        assert "parsed_authors" in entry

    def test_style_check_real(self):
        text = "Smith (2020) found that... And then Smith (2020) also found... Jones et al. (2019) disagreed."
        result = call_gemini(
            f"Check style of this apa7 document:\n\n{text}",
            SYSTEM_PROMPTS["style"],
            os.environ["GOOGLE_API_KEY"],
        )
        assert "style_warnings" in result

    def test_full_analysis_pipeline_real(self):
        doc = """This is a sample document for testing.

According to recent research, climate change has accelerated significantly
(Norwegian, 2022). Other studies have confirmed these findings
(PolarBear, 2020). However, some researchers dispute the rate
(Fish, 2021).

In the Arctic region, the effects are particularly pronounced.
Norwegian (2022) documented a 40% reduction in ice coverage.
PolarBear (2020) found similar trends in the Antarctic.

References

Norwegian, N. (2022). Arctic ice coverage decline. Journal of Climate, 35(4), 112-130.
PolarBear, P. (2020). Antarctic ice trends. Polar Science, 28(1), 45-62.
Fish, F. (2021). Disputing the rate of change. Climate Letters, 12(3), 78-95."""

        results = []
        errors = []
        def done(*args):
            results.append(args)

        analyze_document(doc, "apa7", os.environ["GOOGLE_API_KEY"], lambda m: None, done)
        assert len(results) == 1
        args = results[0]
        if len(args) == 4:
            _, _, _, err = args
            pytest.fail(f"Pipeline failed: {err}")
        citations, refs, warnings = args
        assert len(citations) >= 3
        assert len(refs) >= 3
        matched = sum(1 for c in citations if c.get("status") == "matched")
        assert matched >= 2
