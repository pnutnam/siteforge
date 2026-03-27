# tests/test_add_seeds_to_audience.py
import pytest
import responses
from scripts.add_seeds_to_audience import add_seeds_to_audience

@responses.activate
def test_add_single_seed_success():
    # URL: /group/{audience_id}/customer/{seed_id}/ with body {"account": account_id}
    responses.add(
        responses.POST,
        "https://test.api/group/88/customer/8490/",  # Note: seed_id in path
        json=[{"id": 8490}],  # API returns list of customers
        status=200
    )
    responses.add(
        responses.GET,
        "https://test.api/group/88/customer/",
        json=[{"id": 8490}],
        status=200
    )
    result = add_seeds_to_audience(
        api_base="https://test.api/",
        token="test-token",
        account_id=38,  # Added: required account_id
        audience_id=88,
        seed_ids=[8490],
        dry_run=False
    )
    # Function returns {"audience_id": ..., "added": [...]} not a dict with "id"
    assert result["audience_id"] == 88
    assert 8490 in result["added"]

@responses.activate
def test_add_multiple_seeds_success():
    # First seed
    responses.add(
        responses.POST,
        "https://test.api/group/88/customer/8490/",
        json=[{"id": 8490}],
        status=200
    )
    # Second seed
    responses.add(
        responses.POST,
        "https://test.api/group/88/customer/8491/",
        json=[{"id": 8491}],
        status=200
    )
    responses.add(
        responses.GET,
        "https://test.api/group/88/customer/",
        json=[{"id": 8490}, {"id": 8491}],
        status=200
    )
    result = add_seeds_to_audience(
        api_base="https://test.api/",
        token="test-token",
        account_id=38,
        audience_id=88,
        seed_ids=[8490, 8491],
        dry_run=False
    )
    assert result["audience_id"] == 88
    assert len(result["added"]) == 2

@responses.activate
def test_add_seeds_dry_run():
    result = add_seeds_to_audience(
        api_base="https://test.api/",
        token="test-token",
        account_id=38,
        audience_id=88,
        seed_ids=[8490],
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
