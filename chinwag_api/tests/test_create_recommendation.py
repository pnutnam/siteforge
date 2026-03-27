# tests/test_create_recommendation.py
import pytest
import responses
from scripts.create_recommendation import create_recommendation

@responses.activate
def test_create_recommendation_success():
    responses.add(
        responses.POST,
        "https://test.api/customer/",
        json={"id": 8500, "customer_type": "recommendation"},
        status=201
    )
    responses.add(
        responses.POST,
        "https://test.api/customer/8500/platformuser/",
        json={"id": 9000, "platform": "linkedin", "username": "jane-smith-123"},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/customer/8500/",
        json={"id": 8500, "customer_type": "recommendation"},
        status=200
    )
    result = create_recommendation(
        api_base="https://test.api/",
        token="test-token",
        first_name="Jane",
        last_name="Smith",
        email="jane@company.com",
        platform="linkedin",
        username="jane-smith-123",
        dry_run=False
    )
    assert result["id"] == 8500
    assert result["customer_type"] == "recommendation"

@responses.activate
def test_create_recommendation_dry_run():
    result = create_recommendation(
        api_base="https://test.api/",
        token="test-token",
        first_name="Jane",
        last_name="Smith",
        email="jane@company.com",
        platform="linkedin",
        username="jane-smith-123",
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
