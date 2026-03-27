# tests/test_api_client.py
import pytest
import responses
from scripts.api_client import ChinwagClient

@pytest.fixture
def client():
    return ChinwagClient(api_base="https://test.api/", token="test-token")

def test_client_adds_auth_header(client):
    assert client.session.headers["Authorization"] == "LLT test-token"

@responses.activate
def test_client_get_returns_json(client):
    responses.add(responses.GET, "https://test.api/group/1/", json={"id": 1}, status=200)
    result = client.get("/group/1/")
    assert result == {"id": 1}

@responses.activate
def test_client_post_sends_json(client):
    responses.add(responses.POST, "https://test.api/group/", json={"id": 1}, status=201)
    result = client.post("/group/", json={"name": "test"})
    assert result == {"id": 1}

@responses.activate
def test_client_retries_on_500(client):
    responses.add(responses.GET, "https://test.api/group/1/", json={}, status=500)
    responses.add(responses.GET, "https://test.api/group/1/", json={"id": 1}, status=200)
    result = client.get("/group/1/")
    assert result == {"id": 1}
    assert len(responses.calls) == 2

@responses.activate
def test_client_fails_fast_on_400(client):
    responses.add(responses.GET, "https://test.api/group/1/", json={"error": "bad"}, status=400)
    with pytest.raises(Exception) as exc:
        client.get("/group/1/")
    assert "400" in str(exc.value)
