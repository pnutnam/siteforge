# tests/test_link_sequences_to_playbook.py
import pytest
import responses
from scripts.link_sequences_to_playbook import link_sequences_to_playbook

@responses.activate
def test_link_sequences_success():
    responses.add(
        responses.PATCH,
        "https://test.api/account/152/playbook/26/",
        json={"id": 26, "sequences": [{"id": 100}, {"id": 101}]},
        status=200
    )
    responses.add(
        responses.GET,
        "https://test.api/account/152/playbook/26/",
        json={"id": 26, "sequences": [{"id": 100}, {"id": 101}]},
        status=200
    )
    result = link_sequences_to_playbook(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        playbook_id=26,
        sequence_ids=[100, 101],
        dry_run=False
    )
    assert result["id"] == 26

@responses.activate
def test_link_sequences_dry_run():
    result = link_sequences_to_playbook(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        playbook_id=26,
        sequence_ids=[100],
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
