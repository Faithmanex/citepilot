import pytest
import json
import os
import tempfile
from unittest.mock import patch, MagicMock

from main import extract_json, read_file, call_deepseek, analyze_document, export_pdf

# ── extract_json ──────────────────────────────────────────────────────────

class TestExtractJson:
    def test_plain_json(self):
        assert extract_json('{"a": 1}') == {"a": 1}

    def test_with_triple_backtick(self):
        raw = "```json\n{\"a\": 1}\n```"
        assert extract_json(raw) == {"a": 1}

    def test_with_triple_backtick_no_lang(self):
        raw = "```\n{\"a\": 1}\n```"
        assert extract_json(raw) == {"a": 1}

    def test_multiline_triple_backtick(self):
        raw = "some text\n```\n{\"a\": 1}\n```\ntrailing"
        assert extract_json(raw) == {"a": 1}

    def test_whitespace_handling(self):
        assert extract_json("  \n  {\"a\": 1}  \n  ") == {"a": 1}

    def test_raises_on_invalid(self):
        with pytest.raises(json.JSONDecodeError):
            extract_json("not json at all")

    def test_empty_string_raises(self):
        with pytest.raises(json.JSONDecodeError):
            extract_json("")

    def test_nested_object(self):
        raw = '{"citations": [{"raw_text": "hello", "paragraph_index": 0}]}'
        result = extract_json(raw)
        assert result["citations"][0]["raw_text"] == "hello"

# ── read_file ─────────────────────────────────────────────────────────────

class TestReadFile:
    def test_reads_txt(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("hello world")
            path = f.name
        try:
            text, err = read_file(path)
            assert text == "hello world"
            assert err is None
        finally:
            os.unlink(path)

    def test_returns_error_on_missing_file(self):
        text, err = read_file("nonexistent_file_xyz.txt")
        assert text is None
        assert err is not None
        assert "not found" in err.lower()

    def test_unsupported_extension_reads_as_text(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, encoding="utf-8") as f:
            f.write("a,b,c")
            path = f.name
        try:
            text, err = read_file(path)
            assert text == "a,b,c"
            assert err is None
        finally:
            os.unlink(path)

    def test_empty_txt(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            path = f.name
        try:
            text, err = read_file(path)
            assert text == ""
            assert err is None
        finally:
            os.unlink(path)

# ── call_deepseek (mocked) ───────────────────────────────────────────────

class TestCallDeepSeek:
    @patch("main.OpenAI")
    def test_returns_parsed_json(self, MockOpenAI):
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = '{"result": "ok"}'
        MockOpenAI.return_value = mock_instance

        result = call_deepseek("prompt", "system", "fake-key")
        assert result == {"result": "ok"}

    @patch("main.OpenAI")
    def test_raises_on_non_json(self, MockOpenAI):
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = "hello world"
        MockOpenAI.return_value = mock_instance

        with pytest.raises(ValueError, match="DeepSeek returned non-JSON"):
            call_deepseek("prompt", "system", "fake-key")

    @patch("main.OpenAI")
    def test_strips_markdown_fences(self, MockOpenAI):
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = "```json\n{\"result\": 1}\n```"
        MockOpenAI.return_value = mock_instance

        result = call_deepseek("prompt", "system", "fake-key")
        assert result == {"result": 1}

# ── analyze_document (mocked) ─────────────────────────────────────────────

class TestAnalyzeDocument:
    @patch("main.call_deepseek")
    def test_full_pipeline(self, mock_call):
        mock_call.side_effect = [
            {"citations": [{"raw_text": "Smith (2020)", "paragraph_index": 0, "char_start": 0, "char_end": 14, "context": "...", "extracted_authors": ["Smith"], "extracted_year": 2020, "citation_type": "narrative"}]},
            {"references": [{"raw_entry": "Smith, J. (2020). Title.", "position": 0, "parsed_authors": [{"family": "Smith", "given": "J"}], "parsed_year": 2020, "parsed_title": "Title", "reference_type": "journal_article"}]},
            {"matches": [{"citation_raw_text": "Smith (2020)", "matched_reference_index": 0, "matched_reference_text": "Smith, J. (2020). Title.", "match_type": "exact", "confidence": 0.95, "issues": []}]},
            {"style_warnings": [{"code": "STY-001", "category": "Formatting", "message": "Italicize journal volume", "severity": "warning", "paragraph_index": 0, "char_start": 0, "char_end": 0}]},
        ]

        results = []
        errors = []
        def done(*args):
            results.append(args)

        analyze_document("Body\n\nReferences\n\nSmith, J. (2020). Title.", "apa7", "fake-key", lambda m: None, done)
        assert len(results) == 1
        args = results[0]
        if len(args) == 4:
            pytest.fail(f"Pipeline got error: {args[3]}")
        citations, refs, warnings = args
        assert len(citations) == 1
        assert citations[0]["status"] == "matched"
        assert len(refs) == 1
        assert refs[0]["status"] == "cited"
        assert len(warnings) == 1

    @patch("main.call_gemini")
    def test_no_citations_found(self, mock_call):
        mock_call.side_effect = [
            {"citations": []},
            {"references": []},
            {"style_warnings": []},
        ]

        results = []
        def done(*args):
            results.append(args)

        analyze_document("Just body text no refs", "apa7", "fake-key", lambda m: None, done)
        citations, refs, warnings = results[0]
        assert citations == []
        assert refs == []

    @patch("main.call_gemini")
    def test_propagates_gemini_error(self, mock_call):
        mock_call.side_effect = ValueError("Gemini returned non-JSON: blah")

        results = []
        def done(*args):
            results.append(args)

        analyze_document("Any text", "apa7", "fake-key", lambda m: None, done)
        _, _, _, error = results[0]
        assert error is not None
        assert "Gemini returned non-JSON" in error

# ── export_pdf ────────────────────────────────────────────────────────────

class TestExportPdf:
    def test_creates_pdf(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        try:
            export_pdf(path, "test.txt", "apa7",
                       [{"raw_text": "Smith (2020)", "status": "matched", "extracted_authors": ["Smith"], "extracted_year": 2020, "citation_type": "narrative", "confidence": 0.95}],
                       [{"raw_entry": "Smith, J. (2020). Title.", "status": "cited", "position": 0}],
                       [{"code": "STY-001", "category": "Formatting", "message": "Italicize volume", "severity": "warning", "suggestion": "Add italics"}])
            assert os.path.getsize(path) > 0
            with open(path, "rb") as f:
                header = f.read(5)
                assert header == b"%PDF-"
        finally:
            os.unlink(path)

    def test_creates_pdf_with_no_results(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        try:
            export_pdf(path, "doc.txt", "harvard", [], [], [])
            assert os.path.getsize(path) > 0
        finally:
            os.unlink(path)
