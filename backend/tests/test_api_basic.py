from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Accept common variants, but current app returns {"status": "ok"}
    assert data.get("status") in {"ok", "healthy", "OK"}


def test_proposal_requires_description_or_url():
    # Missing both job_url and job_description should fail validation (422)
    res = client.post("/api/proposal/generate", json={})
    assert res.status_code == 422
    text = res.text
    assert "Either job_description or job_url must be provided" in text


def test_proposal_job_description_too_short():
    payload = {
        "job_description": "too short",
        "user_skills": [],
    }
    res = client.post("/api/proposal/generate", json=payload)
    assert res.status_code == 422
    # Ensure field-level validation message is present
    assert "job_description" in res.text
    assert "at least 10 characters" in res.text or "ensure this value has at least" in res.text
