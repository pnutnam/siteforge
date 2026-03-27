# tests/test_create_sequence.py
import pytest
import responses
from scripts.create_sequence import create_sequence

@responses.activate
def test_create_sequence_success():
    # POST creates the sequence, no GET verification needed (endpoint doesn't exist)
    responses.add(
        responses.POST,
        "https://test.api/sequence/",
        json={"id": 100, "name": "Authority Tone Sequence", "playbook": 26, "account": 38, "steps": [{"order": 1}]},
        status=201
    )
    steps = [{"platform": "email", "subject": "Thought Leadership", "body": "Hello", "delay": 0, "order": 1}]
    result = create_sequence(
        api_base="https://test.api/",
        token="test-token",
        account_id=38,
        playbook_id=26,
        name="Authority Tone Sequence",
        steps=steps,
        dry_run=False
    )
    assert result["id"] == 100
    assert result["name"] == "Authority Tone Sequence"

@responses.activate
def test_create_sequence_dry_run():
    steps = [{"platform": "email", "subject": "TL", "body": "Hi", "delay": 0, "order": 1}]
    result = create_sequence(
        api_base="https://test.api/",
        token="test-token",
        account_id=38,
        playbook_id=26,
        name="Authority Tone Sequence",
        steps=steps,
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0

@responses.activate
def test_create_sequence_invalid_platform():
    """Only 'email' platform is supported; other platforms should raise ValueError."""
    steps = [{"platform": "linkedin", "subject": "TL", "body": "Hi", "delay": 0, "order": 1}]
    with pytest.raises(ValueError) as exc_info:
        create_sequence(
            api_base="https://test.api/",
            token="test-token",
            account_id=38,
            playbook_id=26,
            name="Bad Sequence",
            steps=steps,
            dry_run=False
        )
    assert "Unsupported platform 'linkedin'" in str(exc_info.value)
