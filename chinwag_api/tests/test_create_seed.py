# tests/test_create_seed.py
import pytest
import responses
from scripts.create_seed import create_seed

@responses.activate
def test_create_seed_success():
    responses.add(
        responses.POST,
        "https://test.api/customer/",
        json={"id": 8490, "role": "seed", "account": 152, "first_name": "John", "last_name": "Doe"},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/customer/8490/",
        json={"id": 8490, "role": "seed", "account": 152},
        status=200
    )
    result = create_seed(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        dry_run=False
    )
    assert result["id"] == 8490
    assert result["role"] == "seed"

@responses.activate
def test_create_seed_verifies_role():
    responses.add(
        responses.POST,
        "https://test.api/customer/",
        json={"id": 8490, "role": "lead", "account": 152},
        status=201
    )
    responses.add(
        responses.GET,
        "https://test.api/customer/8490/",
        json={"id": 8490, "role": "lead", "account": 152},
        status=200
    )
    with pytest.raises(AssertionError) as exc:
        create_seed(api_base="https://test.api/", token="test-token", account_id=152, first_name="John", last_name="Doe", email="john@example.com")
    assert "role" in str(exc.value)
    assert "seed" in str(exc.value)

@responses.activate
def test_create_seed_dry_run():
    result = create_seed(
        api_base="https://test.api/",
        token="test-token",
        account_id=152,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        dry_run=True
    )
    assert result is None
    assert len(responses.calls) == 0
