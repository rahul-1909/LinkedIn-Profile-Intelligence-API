import os
from app.config import Settings


def test_settings_defaults():
    s = Settings()
    assert s.cache_ttl_seconds == 3600
    assert "FullProfileWithEntities-91" in s.decoration_id
    assert s.enable_sandbox_demo is True


def test_settings_overrides():
    s = Settings(
        LI_AT="test_token",
        JSESSIONID="ajax:99999",
        CACHE_TTL_SECONDS=1800,
        RATE_LIMIT="20/minute",
    )
    assert s.li_at == "test_token"
    assert s.jsessionid == "ajax:99999"
    assert s.cache_ttl_seconds == 1800
    assert s.rate_limit == "20/minute"


def test_settings_empty_environment_strings(monkeypatch):
    monkeypatch.setenv("CACHE_TTL_SECONDS", "")
    monkeypatch.setenv("ENABLE_SANDBOX_DEMO", "")
    monkeypatch.setenv("LI_AT", "")
    monkeypatch.setenv("JSESSIONID", "")
    monkeypatch.setenv("RATE_LIMIT", "")
    monkeypatch.setenv("LOG_LEVEL", "")

    s = Settings()
    assert s.cache_ttl_seconds == 3600
    assert s.enable_sandbox_demo is True
    assert s.li_at is None
    assert s.jsessionid is None
    assert s.rate_limit == "30/minute"
