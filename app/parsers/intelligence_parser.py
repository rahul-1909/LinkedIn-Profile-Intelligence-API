from datetime import datetime

from app.models.intelligence import CareerMetrics, ProfileIntelligence, SkillCategory
from app.models.profile import Position, ProfileResponse

# Curated skill taxonomies for automated grouping
TECH_LANGUAGES = {
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css", "r",
    "bash", "shell", "dart", "matlab", "perl"
}

FRAMEWORKS_AND_TOOLS = {
    "react", "react.js", "vue", "vue.js", "angular", "node.js", "nodejs", "express",
    "fastapi", "django", "flask", "spring", "spring boot", "next.js", "docker",
    "kubernetes", "aws", "amazon web services", "azure", "gcp", "google cloud",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "git", "github",
    "graphql", "rest api", "terraform", "ci/cd", "linux", "kafka", "pandas", "numpy",
    "pytorch", "tensorflow", "scikit-learn"
}

SOFT_AND_LEADERSHIP = {
    "leadership", "management", "project management", "product management", "agile",
    "scrum", "mentoring", "communication", "team leadership", "cross-functional",
    "problem solving", "system design", "software architecture", "code review",
    "strategic planning", "stakeholder management"
}


def _calculate_months_between(start_year: int | None, start_month: int | None, end_year: int | None, end_month: int | None, is_current: bool) -> int:
    current_year = datetime.now().year
    current_month = datetime.now().month

    s_year = start_year or current_year
    s_month = start_month or 1

    if is_current or not end_year:
        e_year = current_year
        e_month = current_month
    else:
        e_year = end_year
        e_month = end_month or 12

    total_months = (e_year - s_year) * 12 + (e_month - s_month)
    return max(total_months, 1)


def _compute_career_metrics(positions: list[Position]) -> CareerMetrics:
    if not positions:
        return CareerMetrics()

    total_months = 0
    current_role = None
    current_company = None

    for i, p in enumerate(positions):
        dr = p.date_range
        if dr:
            months = _calculate_months_between(
                dr.start_year, dr.start_month, dr.end_year, dr.end_month, dr.is_current
            )
            total_months += months
            if dr.is_current and not current_role:
                current_role = p.title
                current_company = p.company_name
        elif i == 0 and not current_role:
            current_role = p.title
            current_company = p.company_name

    # If no role marked current, pick the most recent one
    if not current_role and positions:
        current_role = positions[0].title
        current_company = positions[0].company_name

    total_years = round(total_months / 12.0, 1)
    num_positions = len(positions)
    avg_tenure = round(total_years / num_positions, 1) if num_positions > 0 else 0.0

    # Seniority level estimation
    all_titles_text = " ".join((p.title or "") for p in positions).lower()
    seniority = "Mid-Level"
    if any(k in all_titles_text for k in ["cto", "ceo", "cfo", "coo", "founder", "co-founder", "vp ", "vice president", "director"]):
        seniority = "Executive / Director"
    elif any(k in all_titles_text for k in ["principal", "staff", "head of", "architect", "lead"]):
        seniority = "Staff / Principal"
    elif any(k in all_titles_text for k in ["senior", "sr.", "sr "]) or total_years >= 5:
        seniority = "Senior"
    elif any(k in all_titles_text for k in ["intern", "trainee", "junior", "associate"]) or total_years < 2:
        seniority = "Entry-Level"

    # Stability Index
    if avg_tenure >= 2.5:
        stability = "High Stability"
    elif avg_tenure >= 1.4 or num_positions <= 2:
        stability = "Stable"
    else:
        stability = "Dynamic / Fast-Paced"

    return CareerMetrics(
        total_experience_years=total_years,
        average_tenure_years=avg_tenure,
        total_positions=num_positions,
        current_role=current_role,
        current_company=current_company,
        seniority_level=seniority,
        stability_index=stability,
    )


def _categorize_skills(skills: list[str]) -> list[SkillCategory]:
    languages: list[str] = []
    frameworks: list[str] = []
    soft: list[str] = []
    other: list[str] = []

    for s in skills:
        cleaned = s.strip().lower()
        if cleaned in TECH_LANGUAGES:
            languages.append(s)
        elif cleaned in FRAMEWORKS_AND_TOOLS:
            frameworks.append(s)
        elif cleaned in SOFT_AND_LEADERSHIP:
            soft.append(s)
        else:
            other.append(s)

    categories = []
    if languages:
        categories.append(SkillCategory(category="Programming Languages", count=len(languages), skills=languages))
    if frameworks:
        categories.append(SkillCategory(category="Frameworks & Cloud", count=len(frameworks), skills=frameworks))
    if soft:
        categories.append(SkillCategory(category="Architecture & Leadership", count=len(soft), skills=soft))
    if other:
        categories.append(SkillCategory(category="Domain & Other Skills", count=len(other), skills=other))

    return categories


def _calculate_completeness_and_tips(profile: ProfileResponse) -> tuple[int, str, list[str]]:
    score = 0
    tips = []

    # 1. Profile photo & cover (15 pts)
    if profile.profile_picture_url:
        score += 10
    else:
        tips.append("Add a high-resolution professional profile photo to boost connection trust.")

    if profile.cover_picture_url:
        score += 5

    # 2. Headline (15 pts)
    if profile.headline and len(profile.headline.strip()) > 10:
        score += 15
    else:
        tips.append("Craft an impactful headline highlighting your specialty, tech stack, or domain.")

    # 3. Summary / About (15 pts)
    if profile.summary and len(profile.summary.strip()) > 50:
        score += 15
    elif profile.summary:
        score += 8
        tips.append("Expand your 'About' summary to share your career story, achievements, and technical philosophy.")
    else:
        tips.append("Add a rich 'About' summary detailing key career milestones and core proficiencies.")

    # 4. Positions & Descriptions (25 pts)
    if profile.positions:
        score += 15
        has_descriptions = any(bool(p.description and len(p.description.strip()) > 30) for p in profile.positions)
        if has_descriptions:
            score += 10
        else:
            tips.append("Add quantifiable metrics (e.g. 'boosted throughput by 40%') to your role descriptions.")
    else:
        tips.append("List your work history and positions.")

    # 5. Education (10 pts)
    if profile.educations:
        score += 10
    else:
        tips.append("Add your academic background, degrees, or university certifications.")

    # 6. Skills (10 pts)
    num_skills = len(profile.skills)
    if num_skills >= 5:
        score += 10
    elif num_skills > 0:
        score += 5
        tips.append("List at least 5 core technical and industry skills.")
    else:
        tips.append("Add your primary skills so recruiters and teammates can discover your profile.")

    # 7. Certifications / Languages / Media (10 pts)
    extra_items = len(profile.certifications) + len(profile.languages) + len(profile.treasury_media)
    if extra_items >= 2:
        score += 10
    elif extra_items == 1:
        score += 5
    else:
        tips.append("Add professional certifications or featured portfolio links to demonstrate credibility.")

    score = min(max(score, 10), 100)

    if score >= 85:
        strength = "All-Star"
    elif score >= 65:
        strength = "Strong"
    elif score >= 45:
        strength = "Intermediate"
    else:
        strength = "Needs Improvement"

    return score, strength, tips


def generate_profile_intelligence(profile: ProfileResponse) -> ProfileIntelligence:
    """Generate high-level career analytics, profile score, and skill intelligence."""
    metrics = _compute_career_metrics(profile.positions)
    skill_names = [s.name for s in profile.skills]
    categories = _categorize_skills(skill_names)
    completeness, strength, tips = _calculate_completeness_and_tips(profile)

    full_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip() or "Professional"

    # Executive recruiter pitch
    role = metrics.current_role or "Software Professional"
    company = f" at {metrics.current_company}" if metrics.current_company else ""
    exp_str = f"with ~{metrics.total_experience_years} years of demonstrated experience" if metrics.total_experience_years > 0 else ""
    skills_preview = f", specializing in {', '.join(skill_names[:3])}" if skill_names else ""

    recruiter_pitch = (
        f"{full_name} is a {metrics.seniority_level} {role}{company} {exp_str}{skills_preview}."
    ).strip()

    return ProfileIntelligence(
        public_identifier=profile.public_identifier or "unknown",
        full_name=full_name,
        headline=profile.headline,
        completeness_score=completeness,
        profile_strength=strength,
        career_metrics=metrics,
        skill_categories=categories,
        top_skills=skill_names[:8],
        optimization_suggestions=tips,
        recruiter_pitch=recruiter_pitch,
    )
