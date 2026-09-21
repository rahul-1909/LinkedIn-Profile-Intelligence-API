import re
from datetime import UTC, datetime

from app.models.profile import (
    Certification,
    DateRange,
    Education,
    Language,
    Location,
    Position,
    ProfileResponse,
    Skill,
    TreasuryItem,
)

DEMO_PROFILES: dict[str, ProfileResponse] = {
    "priya-sharma-tech": ProfileResponse(
        first_name="Priya",
        last_name="Sharma",
        headline="Senior Staff Backend Engineer @ Stripe | Distributed Systems, High-Throughput APIs & Cloud Infrastructure",
        summary=(
            "Distinguished backend engineer with 8+ years building mission-critical distributed systems. "
            "Passionate about low-latency financial infrastructure, scalable microservice architectures, "
            "and event-driven platforms. Speaker at tech conferences and active open-source contributor."
        ),
        public_identifier="priya-sharma-tech",
        profile_url="https://www.linkedin.com/in/priya-sharma-tech/",
        urn="urn:li:fsd_profile:ACoAAByZ123MockPriya",
        location=Location(
            city="San Francisco",
            state="California",
            country="US",
            display="San Francisco Bay Area, CA, USA",
        ),
        profile_picture_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        cover_picture_url="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
        positions=[
            Position(
                title="Senior Staff Software Engineer",
                company_name="Stripe",
                location="San Francisco, CA",
                description=(
                    "Leading the core payment routing platform handling 15,000+ transactions per second.\n"
                    "- Designed and rolled out zero-downtime ledger migration saving $4.2M annually.\n"
                    "- Mentored 12+ senior and staff engineers across global infrastructure groups."
                ),
                employment_type="Full-time",
                date_range=DateRange(start_year=2022, start_month=3, is_current=True),
            ),
            Position(
                title="Staff Backend Engineer",
                company_name="Uber",
                location="Sunnyvale, CA",
                description=(
                    "Engineered real-time geospatial dispatch dispatchers using Go and Kafka.\n"
                    "- Cut p99 endpoint latency from 140ms to 28ms through cache tier optimization."
                ),
                employment_type="Full-time",
                date_range=DateRange(start_year=2019, start_month=1, end_year=2022, end_month=2),
            ),
            Position(
                title="Software Engineer",
                company_name="Amazon Web Services",
                location="Seattle, WA",
                description="Built high-throughput control plane services for AWS DynamoDB.",
                employment_type="Full-time",
                date_range=DateRange(start_year=2016, start_month=8, end_year=2018, end_month=12),
            ),
        ],
        educations=[
            Education(
                school_name="Carnegie Mellon University",
                degree_name="Master of Science",
                field_of_study="Computer Science & Distributed Systems",
                grade="3.92 GPA",
                date_range=DateRange(start_year=2014, end_year=2016),
            ),
            Education(
                school_name="National Institute of Technology",
                degree_name="Bachelor of Technology",
                field_of_study="Computer Science and Engineering",
                grade="Honors",
                date_range=DateRange(start_year=2010, end_year=2014),
            ),
        ],
        skills=[
            Skill(name="Go"),
            Skill(name="Distributed Systems"),
            Skill(name="Python"),
            Skill(name="FastAPI"),
            Skill(name="Kafka"),
            Skill(name="Kubernetes"),
            Skill(name="PostgreSQL"),
            Skill(name="Redis"),
            Skill(name="System Design"),
            Skill(name="Docker"),
            Skill(name="AWS"),
            Skill(name="Microservices"),
        ],
        skills_total=38,
        certifications=[
            Certification(
                name="AWS Certified Solutions Architect – Professional",
                authority="Amazon Web Services",
                issue_date="2023-04",
                url="https://aws.amazon.com/certification/",
            ),
            Certification(
                name="Certified Kubernetes Administrator (CKA)",
                authority="The Linux Foundation",
                issue_date="2022-09",
            ),
        ],
        languages=[
            Language(name="English", proficiency="Native or bilingual"),
            Language(name="Hindi", proficiency="Native or bilingual"),
            Language(name="Spanish", proficiency="Professional working"),
        ],
        treasury_media=[
            TreasuryItem(
                title="High-Throughput Distributed Transactions Architecture Talk",
                url="https://youtube.com",
                kind="url",
                provider="QCon Global",
            ),
            TreasuryItem(
                title="Open-Source Raft Consensus Implementation",
                url="https://github.com",
                kind="url",
                provider="GitHub",
            ),
        ],
        fetched_at=datetime.now(UTC),
    ),
    "alex-chen-dev": ProfileResponse(
        first_name="Alex",
        last_name="Chen",
        headline="AI Research Engineer @ Anthropic | LLM Alignment, Multi-Agent Systems & Inference Optimization",
        summary=(
            "AI researcher and engineer focusing on large language model alignment, agentic workflows, "
            "and efficient tensor execution. Published author at NeurIPS and ICML."
        ),
        public_identifier="alex-chen-dev",
        profile_url="https://www.linkedin.com/in/alex-chen-dev/",
        urn="urn:li:fsd_profile:ACoAAByZ456MockAlex",
        location=Location(
            city="Seattle",
            state="Washington",
            country="US",
            display="Seattle, WA, USA",
        ),
        profile_picture_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        cover_picture_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        positions=[
            Position(
                title="Staff AI Research Engineer",
                company_name="Anthropic",
                location="San Francisco, CA",
                description="Developing scalable evaluation harnesses and alignment protocols for frontier foundation models.",
                employment_type="Full-time",
                date_range=DateRange(start_year=2023, start_month=4, is_current=True),
            ),
            Position(
                title="Research Scientist",
                company_name="Google DeepMind",
                location="Mountain View, CA",
                description="Researched reinforcement learning from human feedback (RLHF) and speculative decoding.",
                employment_type="Full-time",
                date_range=DateRange(start_year=2020, start_month=6, end_year=2023, end_month=3),
            ),
        ],
        educations=[
            Education(
                school_name="Stanford University",
                degree_name="Ph.D. in Computer Science",
                field_of_study="Artificial Intelligence & Machine Learning",
                date_range=DateRange(start_year=2016, end_year=2020),
            )
        ],
        skills=[
            Skill(name="PyTorch"),
            Skill(name="Python"),
            Skill(name="Large Language Models (LLM)"),
            Skill(name="Reinforcement Learning"),
            Skill(name="Transformers"),
            Skill(name="CUDA"),
            Skill(name="C++"),
            Skill(name="Distributed Training"),
        ],
        skills_total=24,
        certifications=[],
        languages=[
            Language(name="English", proficiency="Native or bilingual"),
            Language(name="Mandarin", proficiency="Native or bilingual"),
        ],
        treasury_media=[
            TreasuryItem(
                title="Efficient Speculative Decoding on GPU Clusters (arXiv)",
                url="https://arxiv.org",
                kind="document",
                provider="arXiv",
            )
        ],
        fetched_at=datetime.now(UTC),
    ),
    "marcus-vance-pm": ProfileResponse(
        first_name="Marcus",
        last_name="Vance",
        headline="VP of Product @ Snowflake | Cloud Data Platforms & Developer Experience",
        summary="Product leader with 12+ years spearheading enterprise B2B SaaS data products from inception to hyper-scale.",
        public_identifier="marcus-vance-pm",
        profile_url="https://www.linkedin.com/in/marcus-vance-pm/",
        urn="urn:li:fsd_profile:ACoAAByZ789MockMarcus",
        location=Location(
            city="New York",
            state="New York",
            country="US",
            display="New York, NY, USA",
        ),
        profile_picture_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        cover_picture_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
        positions=[
            Position(
                title="VP of Product Management",
                company_name="Snowflake",
                location="New York, NY",
                description="Heading developer tools, query optimization interfaces, and ecosystem partner integrations.",
                employment_type="Full-time",
                date_range=DateRange(start_year=2021, start_month=1, is_current=True),
            )
        ],
        educations=[
            Education(
                school_name="Harvard Business School",
                degree_name="Master of Business Administration (MBA)",
                date_range=DateRange(start_year=2012, end_year=2014),
            )
        ],
        skills=[
            Skill(name="Product Management"),
            Skill(name="Product Strategy"),
            Skill(name="Cloud Computing"),
            Skill(name="Enterprise Software"),
            Skill(name="SaaS"),
            Skill(name="Strategic Partnerships"),
        ],
        skills_total=19,
        certifications=[],
        languages=[Language(name="English", proficiency="Native or bilingual")],
        treasury_media=[],
        fetched_at=datetime.now(UTC),
    ),
}


def get_demo_profile(slug: str) -> ProfileResponse | None:
    """Return a demo sandbox profile if slug matches or fallback."""
    clean = slug.strip().lower()
    if clean in DEMO_PROFILES:
        return DEMO_PROFILES[clean]
    return None


def get_default_demo_profile() -> ProfileResponse:
    return DEMO_PROFILES["priya-sharma-tech"]


def parse_name_from_slug(slug: str) -> tuple[str, str]:
    """Parse realistic first and last name from a vanity slug."""
    clean = re.sub(r"\d+", "", slug).strip("-_.")
    if not clean:
        return "LinkedIn", "Professional"

    lower = slug.lower()
    if "nallarahulteja" in lower or "rahulteja" in lower:
        return "Rahul Teja", "Nalla"
    if lower in {"rahul-1909", "rahul1909"}:
        return "Rahul", "Teja"

    tokens = [p for p in re.split(r"[-_.]+", clean) if p]
    if len(tokens) >= 2:
        first = " ".join(t.capitalize() for t in tokens[:-1])
        last = tokens[-1].capitalize()
        return first, last

    camel = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", tokens[0])
    if len(camel) >= 2:
        return " ".join(t.capitalize() for t in camel[:-1]), camel[-1].capitalize()

    return tokens[0].capitalize(), ""


def create_sandbox_profile_for_slug(slug: str) -> ProfileResponse:
    """Dynamically synthesize an intelligent sandbox profile for any user vanity slug."""
    matched = get_demo_profile(slug)
    if matched is not None:
        return matched

    first_name, last_name = parse_name_from_slug(slug)

    return ProfileResponse(
        first_name=first_name,
        last_name=last_name,
        headline="Senior Staff Software Engineer & Cloud Architect | Distributed Systems & Scalable Infrastructure",
        summary=(
            "Accomplished software engineer with 7+ years architecting scalable cloud platforms and high-throughput microservices. "
            "Passionate about distributed consensus, event-driven architectures, and high-velocity engineering practices. "
            "Proven track record delivering reliable software products and mentoring high-performing engineering teams."
        ),
        public_identifier=slug,
        profile_url=f"https://www.linkedin.com/in/{slug}/",
        urn=f"urn:li:fsd_profile:ACoAAB{abs(hash(slug)) % 100000000:08d}Mock",
        location=Location(
            city="San Francisco",
            state="California",
            country="US",
            display="San Francisco Bay Area, CA, USA",
        ),
        profile_picture_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        cover_picture_url="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200",
        positions=[
            Position(
                title="Lead Software Engineer",
                company_name="CloudScale Technologies",
                location="San Francisco, CA",
                description=(
                    "Architecting low-latency core platform services supporting 25M+ daily active users.\n"
                    "- Designed fault-tolerant event ingestion pipeline cutting p99 latency by 45%.\n"
                    "- Mentored 8 software engineers and established architectural review standards."
                ),
                employment_type="Full-time",
                date_range=DateRange(start_year=2022, start_month=4, is_current=True),
            ),
            Position(
                title="Senior Backend Engineer",
                company_name="NextGen Systems",
                location="Sunnyvale, CA",
                description=(
                    "Engineered asynchronous processing engines in Python, Go, and Redis.\n"
                    "- Migrated monolithic workloads to containerized Kubernetes clusters with zero downtime."
                ),
                employment_type="Full-time",
                date_range=DateRange(start_year=2019, start_month=6, end_year=2022, end_month=3),
            ),
            Position(
                title="Software Engineer",
                company_name="DataFlow Networks",
                location="Austin, TX",
                description="Built high-throughput REST and gRPC services for real-time telemetry streaming.",
                employment_type="Full-time",
                date_range=DateRange(start_year=2017, start_month=8, end_year=2019, end_month=5),
            ),
        ],
        educations=[
            Education(
                school_name="University of California, Berkeley",
                degree_name="Master of Science",
                field_of_study="Computer Science & Engineering",
                grade="3.9 GPA",
                date_range=DateRange(start_year=2015, end_year=2017),
            ),
            Education(
                school_name="Institute of Technology",
                degree_name="Bachelor of Technology",
                field_of_study="Computer Science",
                grade="First Class with Distinction",
                date_range=DateRange(start_year=2011, end_year=2015),
            ),
        ],
        skills=[
            Skill(name="Distributed Systems"),
            Skill(name="Python"),
            Skill(name="Go"),
            Skill(name="FastAPI"),
            Skill(name="Kubernetes"),
            Skill(name="Docker"),
            Skill(name="PostgreSQL"),
            Skill(name="Redis"),
            Skill(name="System Design"),
            Skill(name="Microservices"),
            Skill(name="AWS"),
            Skill(name="Cloud Architecture"),
            Skill(name="TypeScript"),
            Skill(name="RESTful APIs"),
            Skill(name="Kafka"),
            Skill(name="GraphQL"),
            Skill(name="CI/CD"),
            Skill(name="Git"),
        ],
        skills_total=28,
        certifications=[
            Certification(
                name="AWS Certified Solutions Architect - Professional",
                authority="Amazon Web Services",
                issue_date="2023",
            ),
            Certification(
                name="Certified Kubernetes Administrator (CKA)",
                authority="Linux Foundation",
                issue_date="2022",
            ),
        ],
        languages=[
            Language(name="English", proficiency="Native or bilingual"),
            Language(name="Hindi", proficiency="Professional working"),
        ],
        treasury_media=[],
        is_sandbox_fallback=True,
        fetched_at=datetime.now(UTC),
    )


def list_demo_profiles() -> list[dict[str, str]]:
    return [
        {
            "slug": k,
            "name": f"{v.first_name} {v.last_name}",
            "headline": v.headline or "",
            "role": v.positions[0].title if v.positions else "Engineer",
        }
        for k, v in DEMO_PROFILES.items()
    ]
