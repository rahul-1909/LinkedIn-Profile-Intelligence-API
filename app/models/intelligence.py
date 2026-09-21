from pydantic import BaseModel, Field


class CareerMetrics(BaseModel):
    total_experience_years: float = 0.0
    average_tenure_years: float = 0.0
    total_positions: int = 0
    current_role: str | None = None
    current_company: str | None = None
    seniority_level: str = "Mid-Level"  # Entry-Level | Mid-Level | Senior | Staff / Principal | Executive
    stability_index: str = "Stable"  # High Stability | Stable | Dynamic / Fast-Paced


class SkillCategory(BaseModel):
    category: str
    count: int
    skills: list[str] = Field(default_factory=list)


class ProfileIntelligence(BaseModel):
    public_identifier: str
    full_name: str
    headline: str | None = None
    completeness_score: int = Field(ge=0, le=100, description="Profile score 0-100%")
    profile_strength: str = "Intermediate"  # All-Star | Strong | Intermediate | Needs Improvement
    career_metrics: CareerMetrics
    skill_categories: list[SkillCategory] = Field(default_factory=list)
    top_skills: list[str] = Field(default_factory=list)
    optimization_suggestions: list[str] = Field(default_factory=list)
    recruiter_pitch: str
