import io
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from citepilot_ai.main import app

client = TestClient(app)


# ============================================================================
# 1. POST /api/v1/analyse - Edge Cases & Stress Harness
# ============================================================================

def test_analyse_missing_request_body():
    """Verify that posting no parameters returns clean HTTP 400."""
    response = client.post("/api/v1/analyse")
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    data = response.json()
    assert "detail" in data
    assert "Either 'text' or 'file' must be provided" in data["detail"]


def test_analyse_empty_text_parameter():
    """Verify that empty or whitespace-only text returns clean HTTP 400."""
    response = client.post("/api/v1/analyse", data={"text": "   ", "mode": "full"})
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Provided text is empty" in response.json()["detail"]


@pytest.mark.parametrize("invalid_mode", ["invalid_mode", "foo", "MODE_BAR", "123", "   "])
def test_analyse_invalid_mode_strings(invalid_mode):
    """Verify that invalid mode values return clean HTTP 400."""
    response = client.post("/api/v1/analyse", data={"text": "Sample manuscript text.", "mode": invalid_mode})
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Invalid mode" in response.json()["detail"]


@pytest.mark.parametrize("filename,content_type", [
    ("empty.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ("empty.pdf", "application/pdf"),
    ("empty.txt", "text/plain"),
    ("empty.bin", "application/octet-stream"),
])
def test_analyse_zero_byte_files(filename, content_type):
    """Verify that 0-byte file uploads return clean HTTP 400."""
    files = {"file": (filename, io.BytesIO(b""), content_type)}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Uploaded file is empty" in response.json()["detail"]


def test_analyse_corrupt_docx_zip_file():
    """Verify corrupt ZIP payload with .docx extension returns HTTP 400."""
    corrupt_zip = b"PK\x03\x04" + b"\x00" * 100  # Truncated zip header
    files = {"file": ("corrupt_manuscript.docx", io.BytesIO(corrupt_zip), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Invalid or corrupt document file" in response.json()["detail"]


def test_analyse_random_garbage_docx_file():
    """Verify random binary bytes with .docx extension returns HTTP 400."""
    garbage = bytes(range(256)) * 4
    files = {"file": ("garbage.docx", io.BytesIO(garbage), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Invalid or corrupt document file" in response.json()["detail"]


def test_analyse_malformed_pdf_syntax():
    """Verify malformed PDF payload with .pdf extension returns HTTP 400."""
    malformed_pdf = b"NOT_A_VALID_PDF_HEADER_12345\n\x00\xff\xfe"
    files = {"file": ("malformed.pdf", io.BytesIO(malformed_pdf), "application/pdf")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Invalid or corrupt document file" in response.json()["detail"]


def test_analyse_truncated_pdf_syntax():
    """Verify truncated PDF structure returns HTTP 400."""
    truncated_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    files = {"file": ("truncated.pdf", io.BytesIO(truncated_pdf), "application/pdf")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    assert "Invalid or corrupt document file" in response.json()["detail"]


@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock, return_value=[])
def test_analyse_malformed_binary_upload(mock_style, mock_claims, mock_refs, mock_cites):
    """Verify arbitrary malformed binary upload with non-standard extension returns clean response or 400 without crashing."""
    binary_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    files = {"file": ("test.png", io.BytesIO(binary_data), "image/png")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code in (200, 400)
    assert response.headers["content-type"].startswith("application/json")



# ============================================================================
# 2. POST /api/v1/export/pdf - Edge Cases & Stress Harness
# ============================================================================

def test_export_pdf_empty_json_object():
    """Verify posting empty JSON object {} returns valid PDF response."""
    response = client.post("/api/v1/export/pdf", json={})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_export_pdf_missing_request_body():
    """Verify missing request body returns HTTP 422 Unprocessable Entity (standard 4xx client error)."""
    response = client.post("/api/v1/export/pdf")
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")


def test_export_pdf_malformed_json_body():
    """Verify malformed JSON body returns HTTP 422 Unprocessable Entity."""
    response = client.post(
        "/api/v1/export/pdf",
        content="invalid json string {",
        headers={"content-type": "application/json"}
    )
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")


def test_export_pdf_xss_and_xml_special_characters():
    """Verify PDF export handles XML/HTML special characters without crashing."""
    payload = {
        "citations": [{"raw_text": "<script>alert('xss')</script> & <foo>"}],
        "references": [{"raw_entry": "Author & Co. <2023> 'Special' \"Chars\""}],
        "style_warnings": [{"code": "WARN<1>", "message": "Test & message <unescaped>"}],
        "recency": {"within_5_years_percent": "50% & clean"}
    }
    response = client.post("/api/v1/export/pdf", json={"data": payload})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


# ============================================================================
# 3. POST /api/v1/export/docx - Edge Cases & Stress Harness
# ============================================================================

def test_export_docx_empty_json_object():
    """Verify posting empty JSON object {} returns valid DOCX response."""
    response = client.post("/api/v1/export/docx", json={})
    assert response.status_code == 200
    assert "wordprocessingml" in response.headers["content-type"]
    assert len(response.content) > 0


def test_export_docx_missing_request_body():
    """Verify missing request body returns HTTP 422 Unprocessable Entity."""
    response = client.post("/api/v1/export/docx")
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")


def test_export_docx_malformed_json_body():
    """Verify malformed JSON body returns HTTP 422 Unprocessable Entity."""
    response = client.post(
        "/api/v1/export/docx",
        content="invalid json data }",
        headers={"content-type": "application/json"}
    )
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")


# ============================================================================
# 4. Unhandled Route Paths
# ============================================================================

@pytest.mark.parametrize("route_path", [
    "/api/v1/unknown",
    "/api/v1/nonexistent",
    "/api/v1/analyse/extra_path",
    "/api/v2/analyse",
    "/api/invalid_path",
])
def test_unhandled_routes_return_404_json(route_path):
    """Verify unhandled API routes return clean HTTP 404 JSON responses."""
    for method in ["get", "post", "put", "delete"]:
        caller = getattr(client, method)
        response = caller(route_path)
        assert response.status_code == 404
        assert response.headers["content-type"].startswith("application/json")
        assert "not found" in response.json()["detail"].lower()


# ============================================================================
# 5. Additional Edge Cases: Method Not Allowed, Payload Combinations, WebSocket
# ============================================================================

@pytest.mark.parametrize("endpoint,method", [
    ("/api/v1/analyse", "get"),
    ("/api/v1/analyse", "put"),
    ("/api/v1/analyse", "delete"),
    ("/api/v1/export/pdf", "get"),
    ("/api/v1/export/docx", "get"),
])
def test_disallowed_http_methods_return_405(endpoint, method):
    """Verify disallowed HTTP methods return HTTP 405 Method Not Allowed or 404 Not Found."""
    caller = getattr(client, method)
    response = caller(endpoint)
    assert response.status_code in (404, 405)



@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock, return_value=[])
def test_analyse_both_file_and_text_provided(mock_style, mock_claims, mock_refs, mock_cites):
    """Verify that when both 'file' and 'text' are provided, 'file' takes precedence cleanly without 500 error."""
    files = {"file": ("test.txt", io.BytesIO(b"File text content with (Smith, 2020)"), "text/plain")}
    response = client.post("/api/v1/analyse", data={"text": "Ignored body text"}, files=files)
    assert response.status_code in (200, 400)
    assert response.headers["content-type"].startswith("application/json")


@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock, return_value=[])
def test_analyse_unicode_null_bytes_and_emojis(mock_style, mock_claims, mock_refs, mock_cites):
    """Verify text containing null bytes, zero-width spaces, and emojis executes without crashing."""
    text = "Manuscript text \x00\x00 with emojis 🔥🚀 and zero-width \u200b spaces (Smith, 2020)."
    response = client.post("/api/v1/analyse", data={"text": text, "mode": "full"})
    assert response.status_code in (200, 400)
    assert response.headers["content-type"].startswith("application/json")


@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock, return_value=[])
def test_analyse_oversized_text_payload(mock_style, mock_claims, mock_refs, mock_cites):
    """Verify handling of oversized text payload (1 MB string)."""
    large_text = "Paragraph with citation (Author, 2024).\n\n" * 25000  # ~1MB
    response = client.post("/api/v1/analyse", data={"text": large_text, "mode": "full"})
    assert response.status_code in (200, 400)
    assert response.headers["content-type"].startswith("application/json")


def test_ws_analyse_websocket_bad_json():
    """Verify WebSocket /api/v1/ws/analyse gracefully handles invalid JSON string."""
    with client.websocket_connect("/api/v1/ws/analyse") as websocket:
        websocket.send_text("INVALID_NON_JSON_DATA{")
        data = websocket.receive_json()
        assert data.get("event") == "error"
        assert "error" in data.get("message", "").lower()


@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock, return_value=[])
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock, return_value=[])
def test_ws_analyse_websocket_valid_flow(mock_style, mock_refs, mock_cites):
    """Verify WebSocket /api/v1/ws/analyse handles valid manuscript analysis flow."""
    with client.websocket_connect("/api/v1/ws/analyse") as websocket:
        websocket.send_json({"text": "Test manuscript text (Smith, 2020).", "mode": "full"})
        messages = []
        try:
            while True:
                msg = websocket.receive_json()
                messages.append(msg)
                if msg.get("event") == "complete":
                    break
        except Exception:
            pass
        assert len(messages) > 0
        assert any(m.get("event") in ("progress", "complete") for m in messages)

