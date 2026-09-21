from app.models.profile import ProfileResponse
from app.parsers.profile_parser import parse_profile_response, skills_paging_info


def test_parse_profile_response_from_fixture(sample_voyager_json):
    parsed = parse_profile_response(sample_voyager_json)

    assert parsed["first_name"] == "Rahul"
    assert parsed["last_name"] == "Sharma"
    assert parsed["public_identifier"] == "rahul-sharma-lead"
    assert parsed["profile_url"] == "https://www.linkedin.com/in/rahul-sharma-lead/"
    assert "CloudScale" in parsed["headline"]

    # Pictures
    assert parsed["profile_picture_url"] == "https://media.licdn.com/dms/image/v2/mock/avatar_400.jpg"
    assert parsed["cover_picture_url"] == "https://media.licdn.com/dms/image/v2/mock/cover_800.jpg"

    # Positions
    assert len(parsed["positions"]) == 2
    lead_pos = parsed["positions"][0]
    assert lead_pos["title"] == "Lead Systems Architect"
    assert lead_pos["company_name"] == "CloudScale Technologies"
    assert lead_pos["date_range"]["is_current"] is True

    # Education
    assert len(parsed["educations"]) == 1
    assert parsed["educations"][0]["school_name"] == "Indian Institute of Technology"

    # Skills
    assert len(parsed["skills"]) == 5
    assert parsed["skills"][0]["name"] == "Go"

    # Certification & Media
    assert len(parsed["certifications"]) == 1
    assert parsed["certifications"][0]["name"] == "Certified Kubernetes Administrator"

    assert len(parsed["treasury_media"]) == 1
    assert parsed["treasury_media"][0]["provider"] == "GitHub"

    # Validate against Pydantic model
    validated = ProfileResponse.model_validate(parsed)
    assert validated.first_name == "Rahul"


def test_skills_paging_info(sample_voyager_json):
    total, existing, urn = skills_paging_info(sample_voyager_json)
    assert total == 5
    assert existing == 5
    assert urn == "urn:li:fsd_profile:ACoAAB12345MOCK"
