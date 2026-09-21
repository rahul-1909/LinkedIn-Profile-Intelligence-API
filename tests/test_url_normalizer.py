import pytest

from app.core.errors import InvalidURLError
from app.core.url_normalizer import extract_vanity_slug


def test_extract_vanity_slug_full_urls():
    assert extract_vanity_slug("https://www.linkedin.com/in/rahul-sharma/") == "rahul-sharma"
    assert extract_vanity_slug("http://www.linkedin.com/in/rahul-sharma") == "rahul-sharma"
    assert extract_vanity_slug("https://in.linkedin.com/in/rahul-sharma?trk=feed") == "rahul-sharma"
    assert extract_vanity_slug("https://uk.linkedin.com/in/john_doe-123/") == "john_doe-123"


def test_extract_vanity_slug_without_protocol():
    assert extract_vanity_slug("linkedin.com/in/rahul-sharma") == "rahul-sharma"
    assert extract_vanity_slug("www.linkedin.com/in/rahul-sharma") == "rahul-sharma"


def test_extract_vanity_slug_raw_slug():
    assert extract_vanity_slug("rahul-sharma") == "rahul-sharma"
    assert extract_vanity_slug("in/rahul-sharma") == "rahul-sharma"
    assert extract_vanity_slug("SatyaNadella") == "satyanadella"


def test_invalid_urls_raise_error():
    with pytest.raises(InvalidURLError):
        extract_vanity_slug("")

    with pytest.raises(InvalidURLError):
        extract_vanity_slug("https://twitter.com/in/username")

    with pytest.raises(InvalidURLError):
        extract_vanity_slug("ab")  # too short
