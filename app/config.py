from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def is_valid_cookie(val: str | None) -> bool:
    """Check if a cookie string is provided and not a dummy/placeholder value."""
    if not val:
        return False
    clean = val.strip().strip('"').strip("'")
    if not clean or len(clean) < 6:
        return False
    lower = clean.lower()
    placeholders = (
        "your_li_at",
        "your_jsessionid",
        "cookie_here",
        "placeholder",
        "example",
        "replace_me",
        "1234567890123456789",
    )
    if any(p in lower for p in placeholders):
        return False
    return True


class Settings(BaseSettings):
    """Application configuration and credentials loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
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

    @field_validator("cache_ttl_seconds", mode="before")
    @classmethod
    def parse_cache_ttl(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return 3600
        return int(v)

    @field_validator("enable_sandbox_demo", mode="before")
    @classmethod
    def parse_enable_sandbox(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return True
        if isinstance(v, str):
            return v.strip().lower() in ("true", "1", "yes", "on")
        return bool(v)

    @field_validator("rate_limit", mode="before")
    @classmethod
    def parse_rate_limit(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return "30/minute"
        return str(v).strip()

    @field_validator("log_level", mode="before")
    @classmethod
    def parse_log_level(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return "INFO"
        return str(v).strip()

    @field_validator("skills_page_size", mode="before")
    @classmethod
    def parse_skills_page_size(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return 50
        return int(v)

    @field_validator("skills_max_pages", mode="before")
    @classmethod
    def parse_skills_max_pages(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return 5
        return int(v)

    @field_validator("li_at", "jsessionid", "user_agent", mode="before")
    @classmethod
    def parse_optional_strings(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return str(v).strip()

    @property
    def has_valid_server_credentials(self) -> bool:
        return is_valid_cookie(self.li_at) and is_valid_cookie(self.jsessionid)


@lru_cache
def get_settings() -> Settings:
    return Settings()
