# tests/test_create_audience.py
import pytest
import responses
from scripts.create_audience import create_audience

@responses.activate
def test_create_audience_success():
    responses.add(
        responses.POST,
        "https://test.api/group/",
        json={"id": 88, "name": "Industrial Leads", "kind": "audience"},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/group/88/",
        json={"id": 88, "name": "Industrial Leads", "kind": "audience"},
        status=200
    )
    result = create_audience(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        name="Industrial Leads",
        dry_run=False
    )
    assert result["id"] == 88
    assert result["kind"] == "audience"

@responses.activate
def test_create_audience_dry_run():
    result = create_audience(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        name="Industrial Leads",
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0

@responses.activate
def test_create_audience_kind_not_audience_fails():
    responses.add(
        responses.POST,
        "https://test.api/group/",
        json={"id": 88, "name": "Industrial Leads", "kind": "group"},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/group/88/",
        json={"id": 88, "name": "Industrial Leads", "kind": "group"},
        status=200
    )
    with pytest.raises(AssertionError) as exc:
        create_audience(api_base="https://test.api/", token="test-token", account_id=152, name="Industrial Leads")
    assert "kind" in str(exc.value)
