import io
from unittest.mock import patch, AsyncMock
import pytest
from fastapi.testclient import TestClient

from citepilot_ai.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "citepilot-ai"


def test_analyse_endpoint_missing_input():
    response = client.post("/api/v1/analyse", data={"citation_style": "apa7", "mode": "full"})
    assert response.status_code == 400
    assert "Either 'text' or 'file' must be provided" in response.json()["detail"]


def test_analyse_endpoint_invalid_mode():
    response = client.post("/api/v1/analyse", data={"text": "Sample text", "mode": "invalid_mode_name"})
    assert response.status_code == 400
    assert "Invalid mode" in response.json()["detail"]


@patch("citepilot_ai.api.v1.endpoints.extract_citations", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.detect_uncited_claims", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.match_citations_to_references", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.check_style", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.validate_reference_with_crossref", new_callable=AsyncMock)
@patch("citepilot_ai.api.v1.endpoints.check_retraction_status", new_callable=AsyncMock)
def test_analyse_endpoint_valid_text(
    mock_retraction,
    mock_crossref,
    mock_style,
    mock_match,
    mock_claims,
    mock_parse_refs,
    mock_extract_cites
):
    mock_extract_cites.return_value = [
        {"raw_text": "(Smith, 2020)", "paragraph_index": 0, "extracted_authors": ["Smith"], "extracted_year": 2020}
    ]
    mock_parse_refs.return_value = [
        {"raw_entry": "Smith, J. (2020). AI in Citation. JAI, 1, 1.", "position": 1, "parsed_year": 2020, "parsed_doi": "10.1000/123"}
    ]
    mock_claims.return_value = []
    mock_match.return_value = [
        {"citation_raw_text": "(smith, 2020)", "matched_reference_index": 0, "confidence": 0.95, "match_type": "exact"}
    ]
    mock_style.return_value = []
    mock_crossref.return_value = {"crossref_verified": True, "status": "verified"}
    mock_retraction.return_value = {"is_retracted": False, "status": "normal"}

    response = client.post(
        "/api/v1/analyse",
        data={
            "text": "This research builds on machine learning (Smith, 2020).\n\nReferences\nSmith, J. (2020). AI in Citation. JAI, 1, 1.",
            "citation_style": "apa7",
            "mode": "full"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "full"
    assert "elapsed_seconds" in data
    assert len(data["citations"]) == 1
    assert data["citations"][0]["raw_text"] == "(Smith, 2020)"
    assert data["citations"][0]["status"] == "matched"
    assert data["citations"][0]["matched_reference_index"] == 0
    assert len(data["references"]) == 1
    assert data["references"][0]["status"] == "cited"


def test_analyse_endpoint_mode_normalization():
    with patch("citepilot_ai.api.v1.endpoints.parse_references", new_callable=AsyncMock) as mock_refs:
        mock_refs.return_value = []
        response = client.post(
            "/api/v1/analyse",
            data={
                "text": "Smith, J. (2020). Citation Study.",
                "mode": "references_only"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "reference_only"


def test_analyse_endpoint_corrupt_file_upload():
    # Corrupt zip/docx upload
    file_bytes = b"NOT_A_VALID_DOCX_OR_PDF_FILE"
    files = {"file": ("corrupt.docx", io.BytesIO(file_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/api/v1/analyse", files=files)
    assert response.status_code == 400
    assert "Invalid or corrupt document file" in response.json()["detail"]


def test_export_pdf_endpoint():
    sample_payload = {
        "citations": [{"raw_text": "(Smith, 2020)"}],
        "references": [{"raw_entry": "Smith (2020)"}],
        "style_warnings": [{"code": "TEST", "message": "Author A < B & C"}],
        "recency": {"within_5_years_percent": 80.0, "within_10_years_percent": 100.0, "average_source_age_years": 3.0}
    }
    response = client.post("/api/v1/export/pdf", json={"data": sample_payload})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_export_docx_endpoint():
    sample_payload = {
        "text": "Sample manuscript paragraph with (Smith, 2020).",
        "analysis_data": {
            "style_warnings": [{"code": "STYLE_ERR", "message": "Missing comma", "target_text": "Sample manuscript"}],
            "citations": []
        }
    }
    response = client.post("/api/v1/export/docx", json=sample_payload)
    assert response.status_code == 200
    assert "wordprocessingml" in response.headers["content-type"]
    assert len(response.content) > 100


def test_unhandled_api_route_404():
    response = client.post("/api/v1/nonexistent_route")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
    assert "not found" in response.json()["detail"].lower()
