# tests/test_config.py
import os
import pytest

def test_config_has_api_base():
    from scripts.config import API_BASE
    assert API_BASE == "https://djg-debian.coho-jazz.ts.net/be/"

def test_config_reads_token_from_env(monkeypatch):
    monkeypatch.setenv("CHINWAG_TOKEN", "test-token-123")
    # Re-import to pick up env var
    import importlib
    import scripts.config
    importlib.reload(scripts.config)
    assert scripts.config.TOKEN == "test-token-123"

def test_config_defaults():
    from scripts.config import TIMEOUT, MAX_RETRIES, RETRY_DELAY
    assert TIMEOUT == 30
    assert MAX_RETRIES == 3
    assert RETRY_DELAY == 2
