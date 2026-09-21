import logging

from app.config import Settings, get_settings, is_valid_cookie
from app.core.errors import (
    ConfigurationError,
    ForbiddenError,
    LinkedInProfileAPIError,
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
from app.services.demo_store import (
    create_sandbox_profile_for_slug,
    get_demo_profile,
)

logger = logging.getLogger(__name__)

_profile_cache: InMemoryTTLCache[ProfileResponse] = InMemoryTTLCache()
_intel_cache: InMemoryTTLCache[ProfileIntelligence] = InMemoryTTLCache()


class ProfileService:
    """Coordinates normalization, caching, Voyager extraction, sandbox fallbacks, and intelligence."""

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

        # 2. Check for pre-loaded Demo Sandbox profiles
        demo_match = get_demo_profile(slug)
        if demo_match is not None:
            self.cache.set(slug, demo_match, self.settings.cache_ttl_seconds)
            return demo_match

        # 3. Check credentials validity (ignoring dummy/placeholder values)
        has_server_creds = self.settings.has_valid_server_credentials
        has_client_creds = is_valid_cookie(override_li_at) and is_valid_cookie(override_jsessionid)

        if not has_server_creds and not has_client_creds:
            if self.settings.enable_sandbox_demo:
                logger.info(
                    "No valid LinkedIn credentials configured. Serving synthesized sandbox profile for '%s'",
                    slug,
                )
                sandbox_profile = create_sandbox_profile_for_slug(slug)
                self.cache.set(slug, sandbox_profile, self.settings.cache_ttl_seconds)
                return sandbox_profile
            raise ConfigurationError(
                "LinkedIn credentials are not configured",
                "Set LI_AT and JSESSIONID in your environment or supply client headers.",
            )

        # 4. Perform live Voyager REST request with graceful fallback
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
        except (
            UnauthorizedError,
            ForbiddenError,
            RateLimitError,
            UpstreamError,
            ConfigurationError,
            LinkedInProfileAPIError,
        ) as exc:
            if has_client_creds:
                # Custom client-supplied headers failed; let user see the direct error
                raise exc

            if self.settings.enable_sandbox_demo:
                logger.warning(
                    "Live Voyager request failed for '%s' (%s: %s). Falling back to sandbox demo.",
                    slug,
                    type(exc).__name__,
                    getattr(exc, "detail", str(exc)),
                )
                sandbox_profile = create_sandbox_profile_for_slug(slug)
                self.cache.set(slug, sandbox_profile, self.settings.cache_ttl_seconds)
                return sandbox_profile
            raise exc

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
