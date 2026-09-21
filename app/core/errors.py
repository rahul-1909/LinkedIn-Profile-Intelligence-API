class LinkedInProfileAPIError(Exception):
    """Base exception for all LinkedIn Profile Intelligence API errors."""

    def __init__(self, message: str, detail: str | None = None, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.detail = detail or message
        self.status_code = status_code


class InvalidURLError(LinkedInProfileAPIError):
    def __init__(self, message: str = "Invalid LinkedIn profile URL or slug", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=400)


class UnauthorizedError(LinkedInProfileAPIError):
    def __init__(self, message: str = "LinkedIn session expired or unauthorized", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=401)


class ForbiddenError(LinkedInProfileAPIError):
    def __init__(self, message: str = "Access denied by LinkedIn", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=403)


class ProfileNotFoundError(LinkedInProfileAPIError):
    def __init__(self, message: str = "LinkedIn profile not found", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=404)


class RateLimitError(LinkedInProfileAPIError):
    def __init__(self, message: str = "Rate limit exceeded", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=429)


class UpstreamError(LinkedInProfileAPIError):
    def __init__(self, message: str = "LinkedIn upstream error", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=502)


class ConfigurationError(LinkedInProfileAPIError):
    def __init__(self, message: str = "Configuration error", detail: str | None = None):
        super().__init__(message, detail=detail, status_code=503)
