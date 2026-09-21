from app.models.profile import ProfileResponse
from app.parsers.intelligence_parser import generate_profile_intelligence
from app.parsers.profile_parser import parse_profile_response


def test_generate_profile_intelligence(sample_voyager_json):
    parsed = parse_profile_response(sample_voyager_json)
    profile = ProfileResponse.model_validate(parsed)

    intel = generate_profile_intelligence(profile)

    assert intel.full_name == "Rahul Sharma"
    assert intel.public_identifier == "rahul-sharma-lead"
    assert intel.completeness_score >= 80
    assert intel.profile_strength in ["All-Star", "Strong"]

    # Metrics
    metrics = intel.career_metrics
    assert metrics.current_role == "Lead Systems Architect"
    assert metrics.current_company == "CloudScale Technologies"
    assert metrics.seniority_level in ["Staff / Principal", "Senior", "Executive / Director"]
    assert metrics.total_experience_years > 3.0

    # Skill Categories
    assert len(intel.skill_categories) > 0
    cat_names = [c.category for c in intel.skill_categories]
    assert "Programming Languages" in cat_names or "Frameworks & Cloud" in cat_names

    # Recruiter pitch
    assert "Rahul Sharma" in intel.recruiter_pitch
    assert "CloudScale" in intel.recruiter_pitch
