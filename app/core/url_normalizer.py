import re
from urllib.parse import unquote, urlparse

from app.core.errors import InvalidURLError

SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9\-_%À-ž]{3,100}$")


def extract_vanity_slug(input_val: str) -> str:
    """Normalize a LinkedIn profile URL or raw username slug into a clean vanity slug.

    Supported formats:
    - https://www.linkedin.com/in/johndoe/
    - http://in.linkedin.com/in/johndoe?miniProfileUrn=...
    - linkedin.com/in/johndoe
    - /in/johndoe
    - johndoe
    """
    if not input_val or not isinstance(input_val, str):
        raise InvalidURLError("Input URL or slug cannot be empty")

    raw = input_val.strip()

    # Prepend scheme if missing but looks like a domain
    if "linkedin.com" in raw and not raw.startswith(("http://", "https://")):
        raw = "https://" + raw

    # Check if input is a URL
    if raw.startswith(("http://", "https://")):
        try:
            parsed = urlparse(raw)
        except Exception as exc:
            raise InvalidURLError(f"Malformed URL: {input_val}") from exc

        host = (parsed.hostname or "").lower()
        if not (host == "linkedin.com" or host.endswith(".linkedin.com")):
            raise InvalidURLError(f"Domain '{host}' is not a valid LinkedIn domain")

        path = parsed.path.strip("/")
        parts = path.split("/")
        if len(parts) >= 2 and parts[0] in ("in", "pub"):
            slug = parts[1]
        elif len(parts) == 1 and parts[0]:
            slug = parts[0]
        else:
            raise InvalidURLError("URL must point to a profile path (e.g. /in/username)")
    else:
        # Strip leading /in/ or in/
        clean = raw.strip("/")
        if clean.startswith("in/"):
            clean = clean[3:]
        slug = clean.split("?")[0].split("#")[0].strip("/")

    # Decode percent-encoding
    slug = unquote(slug)

    # Validate slug format
    if not slug or not SLUG_PATTERN.match(slug):
        raise InvalidURLError(
            f"'{input_val}' is not a valid LinkedIn profile URL or vanity username"
        )

    return slug.lower()
