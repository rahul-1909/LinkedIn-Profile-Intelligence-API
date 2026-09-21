from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration and credentials loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LinkedIn session cookies
    li_at: str | None = Field(
        default=None,
        validation_alias=AliasChoices("LI_AT", "LINKEDIN_LI_AT"),
    )
    jsessionid: str | None = Field(
        default=None,
        validation_alias=AliasChoices("JSESSIONID", "LINKEDIN_JSESSIONID"),
    )
    user_agent: str | None = Field(
        default="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        alias="USER_AGENT",
    )

    # Cache & Rate Limiting
    cache_ttl_seconds: int = Field(default=3600, alias="CACHE_TTL_SECONDS")
    rate_limit: str = Field(default="30/minute", alias="RATE_LIMIT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Feature Toggles
    enable_sandbox_demo: bool = Field(default=True, alias="ENABLE_SANDBOX_DEMO")

    # Upstream Voyager parameters
    voyager_base_url: str = "https://www.linkedin.com"
    decoration_id: str = (
        "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-91"
    )
    skills_decoration_id: str = (
        "com.linkedin.voyager.dash.deco.identity.profile.FullProfileSkill-28"
    )
    skills_page_size: int = 50
    skills_max_pages: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
