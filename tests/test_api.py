import pytest
import respx
from httpx import ASGITransport, AsyncClient, Response

from app.config import Settings
from app.core.voyager_client import VoyagerClient
from app.main import create_app
from app.services.profile_service import ProfileService


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    res = await async_client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_session_status(async_client: AsyncClient):
    res = await async_client.get("/api/session/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "sandbox_fallback_active" in data


@pytest.mark.asyncio
async def test_demo_profiles_list(async_client: AsyncClient):
    res = await async_client.get("/api/demo/profiles")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    slugs = [item["slug"] for item in data]
    assert "priya-sharma-tech" in slugs


@pytest.mark.asyncio
async def test_get_demo_profile_by_query(async_client: AsyncClient):
    res = await async_client.get("/api/profile?url=priya-sharma-tech")
    assert res.status_code == 200
    data = res.json()
    assert data["first_name"] == "Priya"
    assert data["last_name"] == "Sharma"
    assert data["public_identifier"] == "priya-sharma-tech"
    assert len(data["positions"]) >= 2


@pytest.mark.asyncio
async def test_post_demo_profile_by_body(async_client: AsyncClient):
    res = await async_client.post("/api/profile", json={"url": "alex-chen-dev"})
    assert res.status_code == 200
    data = res.json()
    assert data["first_name"] == "Alex"
    assert data["public_identifier"] == "alex-chen-dev"


@pytest.mark.asyncio
async def test_get_profile_intelligence(async_client: AsyncClient):
    res = await async_client.get("/api/profile/intelligence?url=priya-sharma-tech")
    assert res.status_code == 200
    data = res.json()
    assert data["public_identifier"] == "priya-sharma-tech"
    assert "completeness_score" in data
    assert "career_metrics" in data
    assert data["career_metrics"]["seniority_level"] != ""
    assert "recruiter_pitch" in data


@pytest.mark.asyncio
async def test_invalid_url_error(async_client: AsyncClient):
    res = await async_client.get("/api/profile?url=bad!domain!url")
    assert res.status_code == 400
    assert res.json()["error"] == "invalid_url"


@pytest.mark.asyncio
@respx.mock
async def test_live_voyager_fetch_with_fixture(sample_voyager_json, mock_settings):
    # Mock upstream LinkedIn Voyager REST endpoint
    respx.get("https://www.linkedin.com/voyager/api/identity/dash/profiles").mock(
        return_value=Response(200, json=sample_voyager_json)
    )

    voyager = VoyagerClient(mock_settings)
    service = ProfileService(voyager=voyager, settings=mock_settings)

    profile = await service.get_profile("rahul-sharma-lead")
    assert profile.first_name == "Rahul"
    assert profile.last_name == "Sharma"
    assert profile.public_identifier == "rahul-sharma-lead"
    await service.close()


@pytest.mark.asyncio
@respx.mock
async def test_upstream_401_unauthorized(mock_settings):
    respx.get("https://www.linkedin.com/voyager/api/identity/dash/profiles").mock(
        return_value=Response(401, json={"message": "Unauthorized"})
    )

    app = create_app()
    # Provide custom headers to trigger live request
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(
            "/api/profile?url=live-target-slug",
            headers={
                "X-LinkedIn-Li-At": "expired_li_at",
                "X-LinkedIn-JSessionID": "ajax:expired",
            },
        )
        assert res.status_code == 401
        assert res.json()["error"] == "unauthorized"


@pytest.mark.asyncio
@respx.mock
async def test_dummy_credentials_fallback_to_bridge():
    """Verify that placeholder credentials gracefully fallback to upstream provider."""
    respx.get("https://linked-in-profile-api.vercel.app/api/profile").mock(
        return_value=Response(
            200,
            json={
                "first_name": "Rahul",
                "last_name": "Teja",
                "headline": "Software Intern",
                "public_identifier": "nallarahulteja",
                "positions": [],
                "educations": [],
                "skills": [{"name": "Python"}],
            },
        )
    )
    dummy_settings = Settings(
        LI_AT="your_li_at_cookie_here",
        JSESSIONID="ajax:1234567890123456789",
    )
    service = ProfileService(settings=dummy_settings)
    profile = await service.get_profile("https://www.linkedin.com/in/nallarahulteja")
    assert profile.public_identifier == "nallarahulteja"
    assert profile.first_name == "Rahul"
    assert profile.last_name == "Teja"
    assert len(profile.skills) == 1


@pytest.mark.asyncio
@respx.mock
async def test_upstream_401_server_fallback(mock_settings):
    """Verify that when server credentials fail with 401, it falls back to upstream provider."""
    respx.get("https://www.linkedin.com/voyager/api/identity/dash/profiles").mock(
        return_value=Response(401, json={"message": "Unauthorized"})
    )
    respx.get("https://linked-in-profile-api.vercel.app/api/profile").mock(
        return_value=Response(
            200,
            json={
                "first_name": "Satya",
                "last_name": "Nadella",
                "public_identifier": "satyanadella",
                "positions": [],
                "educations": [],
                "skills": [],
            },
        )
    )

    voyager = VoyagerClient(mock_settings)
    service = ProfileService(voyager=voyager, settings=mock_settings)

    profile = await service.get_profile("satyanadella")
    assert profile.public_identifier == "satyanadella"
    assert profile.first_name == "Satya"
    await service.close()
