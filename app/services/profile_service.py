import logging
import httpx

from app.config import Settings, get_settings, is_valid_cookie
from app.core.errors import (
    ConfigurationError,
    ForbiddenError,
    LinkedInProfileAPIError,
    ProfileNotFoundError,
    RateLimitError,
    UnauthorizedError,
    UpstreamError,
)
from app.core.url_normalizer import extract_vanity_slug
from app.core.voyager_client import VoyagerClient
from app.models.intelligence import ProfileIntelligence
from app.models.profile import ProfileResponse
from app.parsers.intelligence_parser import generate_profile_intelligence
from app.parsers.profile_parser import parse_profile_response
from app.services.cache import InMemoryTTLCache
from app.services.demo_store import get_demo_profile

logger = logging.getLogger(__name__)

_profile_cache: InMemoryTTLCache[ProfileResponse] = InMemoryTTLCache()
_intel_cache: InMemoryTTLCache[ProfileIntelligence] = InMemoryTTLCache()

UPSTREAM_FALLBACK_URL = "https://linked-in-profile-api.vercel.app/api/profile"


class ProfileService:
    """Coordinates normalization, caching, direct Voyager extraction, live fallback, and career intelligence."""

    def __init__(
        self,
        voyager: VoyagerClient | None = None,
        settings: Settings | None = None,
        cache: InMemoryTTLCache[ProfileResponse] | None = None,
        intel_cache: InMemoryTTLCache[ProfileIntelligence] | None = None,
    ):
        self.settings = settings or get_settings()
        self.voyager = voyager or VoyagerClient(self.settings)
        self.cache = cache if cache is not None else _profile_cache
        self.intel_cache = intel_cache if intel_cache is not None else _intel_cache

    async def _fetch_from_upstream_bridge(self, slug: str) -> ProfileResponse | None:
        """Fetch verified live LinkedIn profile from upstream provider if local credentials unavailable."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(f"{UPSTREAM_FALLBACK_URL}?url={slug}")
                if res.status_code == 200:
                    data = res.json()
                    profile = ProfileResponse.model_validate(data)
                    return profile
                if res.status_code == 404:
                    raise ProfileNotFoundError(f"LinkedIn profile '{slug}' was not found")
                if res.status_code == 429:
                    raise RateLimitError("Rate limit exceeded on upstream provider")
        except (ProfileNotFoundError, RateLimitError):
            raise
        except Exception as exc:
            logger.debug("Upstream bridge request for '%s' returned: %s", slug, exc)
        return None

    async def get_profile(
        self,
        url_or_slug: str,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> ProfileResponse:
        slug = extract_vanity_slug(url_or_slug)

        # 1. Check in-memory cache
        cached = self.cache.get(slug)
        if cached is not None:
            return cached

        # 2. Check for pre-loaded Demo profiles
        demo_match = get_demo_profile(slug)
        if demo_match is not None:
            self.cache.set(slug, demo_match, self.settings.cache_ttl_seconds)
            return demo_match

        # 3. Check credentials validity
        has_server_creds = self.settings.has_valid_server_credentials
        has_client_creds = is_valid_cookie(override_li_at) and is_valid_cookie(override_jsessionid)

        # 4. If credentials exist, perform direct Voyager REST request
        if has_server_creds or has_client_creds:
            try:
                raw = await self.voyager.fetch_profile_raw(
                    slug,
                    override_li_at=override_li_at,
                    override_jsessionid=override_jsessionid,
                )
                raw = await self.voyager.enrich_with_all_skills(
                    slug,
                    raw,
                    override_li_at=override_li_at,
                    override_jsessionid=override_jsessionid,
                )
                parsed = parse_profile_response(raw)
                profile = ProfileResponse.model_validate(parsed)
                self.cache.set(slug, profile, self.settings.cache_ttl_seconds)
                return profile
            except (UnauthorizedError, ForbiddenError, UpstreamError) as exc:
                if has_client_creds:
                    raise exc
                logger.warning("Local server credentials failed (%s); trying upstream bridge...", exc)

        # 5. Live fallback: fetch real LinkedIn data from upstream bridge
        bridge_profile = await self._fetch_from_upstream_bridge(slug)
        if bridge_profile is not None:
            self.cache.set(slug, bridge_profile, self.settings.cache_ttl_seconds)
            return bridge_profile

        # 6. If all avenues fail, raise configuration or not found error
        if not has_server_creds and not has_client_creds:
            raise ConfigurationError(
                "LinkedIn credentials are not configured",
                "Please configure LI_AT and JSESSIONID in your environment or headers.",
            )

        raise UpstreamError("Failed to retrieve profile from LinkedIn Voyager API")

    async def get_intelligence(
        self,
        url_or_slug: str,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> ProfileIntelligence:
        slug = extract_vanity_slug(url_or_slug)

        cached = self.intel_cache.get(slug)
        if cached is not None:
            return cached

        profile = await self.get_profile(
            url_or_slug,
            override_li_at=override_li_at,
            override_jsessionid=override_jsessionid,
        )
        intelligence = generate_profile_intelligence(profile)

        self.intel_cache.set(slug, intelligence, self.settings.cache_ttl_seconds)
        return intelligence

    async def close(self) -> None:
        await self.voyager.close()
