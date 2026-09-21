import logging
from typing import Any
from urllib.parse import quote

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.config import Settings, get_settings
from app.core.errors import (
    ConfigurationError,
    ForbiddenError,
    ProfileNotFoundError,
    RateLimitError,
    UnauthorizedError,
    UpstreamError,
)
from app.parsers.profile_parser import merge_skill_entities, skills_paging_info

logger = logging.getLogger(__name__)

RETRYABLE_STATUS = {500, 502, 503, 504}


class VoyagerClient:
    """Async HTTP/2 client for LinkedIn Voyager REST profile endpoints."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self._client: httpx.AsyncClient | None = None

    def _build_headers(
        self,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> dict[str, str]:
        li_at = override_li_at or self.settings.li_at
        jsessionid = override_jsessionid or self.settings.jsessionid
        user_agent = self.settings.user_agent or "Mozilla/5.0"

        if not li_at or not jsessionid:
            raise ConfigurationError(
                "LinkedIn session credentials are not configured",
                "Please configure LI_AT and JSESSIONID in your environment, or provide them via request headers.",
            )

        clean_jsessionid = jsessionid.strip('"')
        return {
            "Cookie": f'li_at={li_at.strip()}; JSESSIONID="{clean_jsessionid}"',
            "csrf-token": clean_jsessionid,
            "x-restli-protocol-version": "2.0.0",
            "Accept": "application/vnd.linkedin.normalized+json+2.1",
            "User-Agent": user_agent,
            "x-li-lang": "en_US",
        }

    def _profile_url(self, slug: str) -> str:
        decoration = self.settings.decoration_id
        return (
            f"{self.settings.voyager_base_url}/voyager/api/identity/dash/profiles"
            f"?q=memberIdentity&memberIdentity={slug}"
            f"&decorationId={decoration}"
        )

    def _skills_member_url(self, slug: str, start: int, count: int) -> str:
        decoration = self.settings.skills_decoration_id
        return (
            f"{self.settings.voyager_base_url}/voyager/api/identity/dash/profileSkills"
            f"?q=memberIdentity&memberIdentity={slug}"
            f"&decorationId={decoration}"
            f"&start={start}&count={count}"
        )

    def _skills_profile_urn_url(self, profile_urn: str, start: int, count: int) -> str:
        encoded = quote(profile_urn, safe="")
        return (
            f"{self.settings.voyager_base_url}/voyager/api/identity/dash/profiles"
            f"/{encoded}/skills?start={start}&count={count}"
        )

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            has_h2 = False
            try:
                import h2  # noqa: F401

                has_h2 = True
            except ImportError:
                has_h2 = False

            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                http2=has_h2,
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _map_status_error(self, status: int, slug: str) -> None:
        if status == 401:
            raise UnauthorizedError(
                "LinkedIn session expired or invalid",
                "Your LI_AT / JSESSIONID session cookie has expired or was revoked by LinkedIn.",
            )
        if status == 403:
            raise ForbiddenError(
                "Access denied by LinkedIn",
                f"LinkedIn denied access to profile '{slug}'. Account checkpoint or restriction active.",
            )
        if status == 404:
            raise ProfileNotFoundError(
                "Profile not found",
                f"No LinkedIn profile found for slug '{slug}'.",
            )
        if status == 429:
            raise RateLimitError(
                "Upstream rate limit reached",
                "LinkedIn upstream rate limit reached. Please wait a few moments before retrying.",
            )
        if status >= 500:
            raise UpstreamError(
                "LinkedIn service error",
                f"LinkedIn returned HTTP {status}.",
            )
        raise UpstreamError(
            "Unexpected upstream response",
            f"LinkedIn returned HTTP {status} for profile '{slug}'.",
        )

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError, UpstreamError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=1, max=8),
        reraise=True,
    )
    async def fetch_profile_raw(
        self,
        slug: str,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> dict[str, Any]:
        """Fetch raw Voyager profile JSON for a vanity slug."""
        client = await self._get_client()
        url = self._profile_url(slug)
        headers = self._build_headers(override_li_at, override_jsessionid)

        logger.info("Executing Voyager REST fetch", extra={"slug": slug})

        try:
            response = await client.get(url, headers=headers)
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            logger.warning(
                "Network timeout/error during Voyager fetch",
                extra={"slug": slug, "error": str(exc)},
            )
            raise UpstreamError("Network error contacting LinkedIn", str(exc)) from exc

        if response.status_code == 200:
            return response.json()

        if response.status_code == 429:
            self._map_status_error(429, slug)

        if response.status_code in RETRYABLE_STATUS:
            raise UpstreamError(
                "Retryable upstream error",
                f"LinkedIn returned HTTP {response.status_code}",
            )

        self._map_status_error(response.status_code, slug)
        return {}

    async def _get_json(
        self,
        url: str,
        slug: str,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> dict[str, Any] | None:
        """Helper to fetch optional JSON payloads without throwing hard errors on 404."""
        client = await self._get_client()
        headers = self._build_headers(override_li_at, override_jsessionid)
        try:
            response = await client.get(url, headers=headers)
        except (httpx.TimeoutException, httpx.NetworkError):
            return None

        if response.status_code == 200:
            return response.json()
        return None

    async def fetch_skills_page(
        self,
        slug: str,
        *,
        start: int,
        count: int,
        profile_urn: str | None = None,
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> dict[str, Any] | None:
        payload = await self._get_json(
            self._skills_member_url(slug, start, count),
            slug,
            override_li_at,
            override_jsessionid,
        )
        if payload is not None:
            return payload
        if profile_urn:
            return await self._get_json(
                self._skills_profile_urn_url(profile_urn, start, count),
                slug,
                override_li_at,
                override_jsessionid,
            )
        return None

    @staticmethod
    def _extract_skill_entities(payload: dict[str, Any]) -> list[dict[str, Any]]:
        included = payload.get("included") or []
        skills = [
            e
            for e in included
            if isinstance(e, dict) and (e.get("$type") or e.get("type") or "").endswith("Skill")
        ]
        if skills:
            return skills

        data = payload.get("data") or {}
        elements = data.get("elements") or []
        return [
            e
            for e in elements
            if isinstance(e, dict)
            and (e.get("$type") or e.get("type") or e.get("name"))
            and (e.get("name") or (e.get("$type") or "").endswith("Skill"))
        ]

    async def enrich_with_all_skills(
        self,
        slug: str,
        raw: dict[str, Any],
        override_li_at: str | None = None,
        override_jsessionid: str | None = None,
    ) -> dict[str, Any]:
        """Page remaining skills when total skills exceed the initial page."""
        total, existing, profile_urn = skills_paging_info(raw)
        if total <= existing:
            return raw

        page_size = self.settings.skills_page_size
        max_pages = self.settings.skills_max_pages
        start = existing
        collected: list[dict[str, Any]] = []

        for _ in range(max_pages):
            if start >= total:
                break
            page = await self.fetch_skills_page(
                slug,
                start=start,
                count=page_size,
                profile_urn=profile_urn,
                override_li_at=override_li_at,
                override_jsessionid=override_jsessionid,
            )
            if page is None:
                break

            skills = self._extract_skill_entities(page)
            if not skills:
                break
            collected.extend(skills)
            start += len(skills)
            if len(skills) < page_size:
                break

        if not collected:
            return raw
        return merge_skill_entities(raw, collected)
