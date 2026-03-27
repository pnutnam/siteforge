# tests/test_create_playbook.py
import pytest
import responses
from scripts.create_playbook import create_playbook

@responses.activate
def test_create_playbook_success():
    responses.add(
        responses.POST,
        "https://test.api/account/152/playbook/",
        json={"id": 26, "name": "Industrial Marketing Playbook", "audiences": [{"id": 88}]},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/account/152/playbook/26/",
        json={"id": 26, "name": "Industrial Marketing Playbook", "audiences": [{"id": 88}]},
        status=200
    )
    result = create_playbook(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        name="Industrial Marketing Playbook",
        audience_ids=[88],
        dry_run=False
    )
    assert result["id"] == 26
    assert result["name"] == "Industrial Marketing Playbook"

@responses.activate
def test_create_playbook_dry_run():
    result = create_playbook(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        name="Industrial Marketing Playbook",
        audience_ids=[88],
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
