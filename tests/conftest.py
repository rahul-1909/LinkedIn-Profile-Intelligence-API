import json
from pathlib import Path
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import Settings
from app.main import create_app

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_voyager_json() -> dict[str, Any]:
    with open(FIXTURES_DIR / "sample_voyager_profile.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def mock_settings() -> Settings:
    return Settings(
        LI_AT="mock_li_at_token",
        JSESSIONID="ajax:1234567890",
        USER_AGENT="Mozilla/5.0 (Test Environment)",
        CACHE_TTL_SECONDS=300,
        RATE_LIMIT="100/minute",
        ENABLE_SANDBOX_DEMO=True,
    )


@pytest.fixture
async def async_client():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
