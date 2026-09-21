import logging
import os
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request
from slowapi import Limiter

from app.config import Settings, get_settings
from app.models.intelligence import ProfileIntelligence
from app.models.profile import ProfileResponse
from app.models.requests import ProfileRequest
from app.services.demo_store import list_demo_profiles
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)



def get_client_ip(request: Request) -> str:
    """Safely extract remote client IP with reverse-proxy and serverless support."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(
    key_func=get_client_ip,
    enabled=not bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")),
)
router = APIRouter(prefix="/api", tags=["profile"])


def get_profile_service() -> ProfileService:
    return ProfileService()


@router.get("/profile", response_model=ProfileResponse, summary="Fetch structured profile via GET")
@limiter.limit(get_settings().rate_limit)
async def get_profile_by_query(
    request: Request,
    url: Annotated[
        str,
        Query(
            min_length=1,
            max_length=2048,
            description="LinkedIn profile URL or vanity username slug",
        ),
    ],
    x_linkedin_li_at: Annotated[str | None, Header(alias="X-LinkedIn-Li-At")] = None,
    x_linkedin_jsessionid: Annotated[str | None, Header(alias="X-LinkedIn-JSessionID")] = None,
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    return await service.get_profile(
        url,
        override_li_at=x_linkedin_li_at,
        override_jsessionid=x_linkedin_jsessionid,
    )


@router.post(
    "/profile", response_model=ProfileResponse, summary="Fetch structured profile via POST"
)
@limiter.limit(get_settings().rate_limit)
async def get_profile_by_body(
    request: Request,
    body: ProfileRequest,
    x_linkedin_li_at: Annotated[str | None, Header(alias="X-LinkedIn-Li-At")] = None,
    x_linkedin_jsessionid: Annotated[str | None, Header(alias="X-LinkedIn-JSessionID")] = None,
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    return await service.get_profile(
        body.url,
        override_li_at=x_linkedin_li_at,
        override_jsessionid=x_linkedin_jsessionid,
    )


@router.get(
    "/profile/intelligence",
    response_model=ProfileIntelligence,
    summary="Compute Profile Intelligence (Seniority, Completeness, Career Metrics, Skills)",
)
@limiter.limit(get_settings().rate_limit)
async def get_profile_intelligence(
    request: Request,
    url: Annotated[
        str,
        Query(min_length=1, max_length=2048, description="LinkedIn profile URL or vanity slug"),
    ],
    x_linkedin_li_at: Annotated[str | None, Header(alias="X-LinkedIn-Li-At")] = None,
    x_linkedin_jsessionid: Annotated[str | None, Header(alias="X-LinkedIn-JSessionID")] = None,
    service: ProfileService = Depends(get_profile_service),
) -> ProfileIntelligence:
    return await service.get_intelligence(
        url,
        override_li_at=x_linkedin_li_at,
        override_jsessionid=x_linkedin_jsessionid,
    )


@router.post(
    "/profile/intelligence",
    response_model=ProfileIntelligence,
    summary="Compute Profile Intelligence via POST",
)
@limiter.limit(get_settings().rate_limit)
async def post_profile_intelligence(
    request: Request,
    body: ProfileRequest,
    x_linkedin_li_at: Annotated[str | None, Header(alias="X-LinkedIn-Li-At")] = None,
    x_linkedin_jsessionid: Annotated[str | None, Header(alias="X-LinkedIn-JSessionID")] = None,
    service: ProfileService = Depends(get_profile_service),
) -> ProfileIntelligence:
    return await service.get_intelligence(
        body.url,
        override_li_at=x_linkedin_li_at,
        override_jsessionid=x_linkedin_jsessionid,
    )


@router.get("/demo/profiles", summary="List available sandbox demo profiles")
async def get_demo_profiles_list() -> list[dict[str, str]]:
    return list_demo_profiles()


@router.get(
    "/session/status", summary="Check current server session status and sandbox availability"
)
async def get_session_status(
    settings: Settings = Depends(get_settings),
) -> dict[str, bool | str]:
    has_credentials = settings.has_valid_server_credentials
    return {
        "configured": has_credentials,
        "sandbox_fallback_active": settings.enable_sandbox_demo,
        "mode": "live" if has_credentials else "sandbox",
    }
