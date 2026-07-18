import pytest
from fastapi.testclient import TestClient
from api.main import app
import os
import json

client = TestClient(app)

def test_check_success(monkeypatch):
    # Mock evaluate_content to succeed
    from src.schemas import DetectionVerdict
    async def mock_evaluate_content(content):
        return DetectionVerdict(
            is_injection=False,
            confidence=0.9,
            reasoning="Looks safe.",
            triggered_by="heuristic",
            matched_patterns=[]
        )
    monkeypatch.setattr("api.routes.check.evaluate_content", mock_evaluate_content)

    response = client.post("/check", json={"content": "Hello world"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_injection"] is False
    assert data["error"] is None

def test_check_pipeline_failure(monkeypatch):
    # Mock evaluate_content to raise an exception
    async def mock_evaluate_content_fail(content):
        raise ValueError("Simulated pipeline failure")
    monkeypatch.setattr("api.routes.check.evaluate_content", mock_evaluate_content_fail)

    response = client.post("/check", json={"content": "Hello world"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_injection"] is False
    assert "Pipeline error" in data["error"]
    assert data["triggered_by"] == "heuristic"

def test_batch_check_limit():
    items = ["text"] * 51
    response = client.post("/check/batch", json={"items": items})
    assert response.status_code == 422
    assert "at most 50 items" in response.text

def test_metrics_not_found(monkeypatch, tmp_path):
    # Mock the paths so they don't exist
    monkeypatch.setattr("api.routes.metrics.METRICS_FILE", str(tmp_path / "nonexistent.json"))
    response = client.get("/metrics")
    assert response.status_code == 404
    assert "Metrics file not found" in response.json()["detail"]

def test_failures_not_found(monkeypatch, tmp_path):
    monkeypatch.setattr("api.routes.metrics.FAILURES_FILE", str(tmp_path / "nonexistent.json"))
    response = client.get("/metrics/failures")
    assert response.status_code == 404
    assert "Failures file not found" in response.json()["detail"]
