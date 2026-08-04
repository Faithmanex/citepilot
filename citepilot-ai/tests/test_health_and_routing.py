import pytest
from fastapi.testclient import TestClient
from citepilot_ai.main import app
from citepilot_ai.config import settings

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "citepilot-ai"
    assert "ai_engine_ready" in data
    assert "model" in data


def test_invalid_api_route():
    response = client.get("/api/v1/nonexistent_route")
    assert response.status_code == 404
    assert response.json()["detail"] == "API endpoint not found"
