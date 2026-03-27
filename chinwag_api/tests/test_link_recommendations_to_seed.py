# tests/test_link_recommendations_to_seed.py
import pytest
import responses
from scripts.link_recommendations_to_seed import link_recommendations_to_seed

@responses.activate
def test_link_recommendations_success():
    # POST returns 201 with empty body on success
    responses.add(
        responses.POST,
        "https://test.api/customer/8490/recommend/",
        json={},  # API returns empty body on success
        status=201
    )
    result = link_recommendations_to_seed(
        api_base="https://test.api/",
        token="test-token",
        seed_id=8490,
        recommendation_ids=[8500, 8501],
        dry_run=False
    )
    # Returns the recommendation_ids since verification via GET is not possible
    assert result == [8500, 8501]

@responses.activate
def test_link_recommendations_dry_run():
    result = link_recommendations_to_seed(
        api_base="https://test.api/",
        token="test-token",
        seed_id=8490,
        recommendation_ids=[8500],
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
