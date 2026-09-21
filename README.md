# LinkedIn Profile Intelligence API

[![Python 3.12](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](./Dockerfile)
[![Tests Passing](https://img.shields.io/badge/tests-18%20passing-brightgreen.svg)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **High-performance LinkedIn Profile Extraction & Career Intelligence Engine** powered by authenticated Voyager REST endpoints, sub-300ms latency, and automated profile analytics — without browser automation, Selenium, or DOM scraping.

---

## Key Highlights

- ⚡ **Direct Voyager REST Protocol**: Communicates directly with LinkedIn's Rest.li 2.0 entity graph (`FullProfileWithEntities-91`) over HTTP/2 with double-submit cookie security. Zero headless browser overhead.
- 🧠 **Profile Intelligence & Career Analytics**:
  - **Tenure & Career Velocity**: Calculates total experience years, average duration per role, and career stability index.
  - **Seniority Estimator**: Automatically detects seniority rank (Entry-Level, Mid-Level, Senior, Staff/Principal, Executive).
  - **Profile Completeness Score (0–100%)**: Quantitative rating assessing headline impact, summary depth, experience descriptions, and skill density with actionable recommendations.
  - **Skill Taxonomy Clustering**: Categorizes skills into Programming Languages, Frameworks & Cloud, and Architecture & Leadership.
  - **Recruiter Executive Briefing**: Generates an instant 2-sentence summary designed for hiring managers and recruiters.
- 🛡️ **Zero-Config Demo Sandbox**: Pre-loaded with realistic profiles (Staff Engineer, AI Researcher, VP of Product) so users and recruiters can test the API and web dashboard immediately without configuring LinkedIn credentials.
- 🔑 **Client-Side Session Injection**: Optional browser-level cookie configuration allowing users to query live LinkedIn data directly without sharing secrets with the server.
- 📦 **Multi-Format Export**: 1-click downloads for structured JSON, formatted Markdown resumes (LLM-ready), and live code snippets (cURL, Python `httpx`, JavaScript `fetch`).
- 🚀 **Production-Ready**: In-memory thread-safe TTL cache, SlowAPI rate limiting, Docker containerization, and Vercel serverless deployment support.

---

## Architecture

```text
Client (Web UI / cURL / Application)
  │
  ├──► GET /api/profile?url={slug}
  ├──► GET /api/profile/intelligence?url={slug}
  │
  ▼
URL & Slug Normalizer (Handles full URLs, country subdomains, vanity slugs)
  │
  ▼
Thread-Safe In-Memory TTL Cache (Fast memory retrieval)
  │
  ├──► [Cache Hit] ──► Return cached Profile / Intelligence
  │
  ▼ [Cache Miss]
Profile Intelligence Coordinator
  │
  ├──► [Demo Slug or No Credentials] ──► Serve Sandbox Mock Store
  │
  ▼ [Live Request]
VoyagerClient (Rest.li 2.0, HTTP/2, Exponential Backoff Retries)
  │
  ▼
Normalized Entity Graph Parser (Resolves $type schemas & high-res CDN images)
  │
  ▼
Intelligence & Analytics Engine (Seniority, Tenure, Completeness Score)
  │
  ▼
Validated Pydantic v2 Models (ProfileResponse, ProfileIntelligence)
```

---

## API Reference

### 1. Fetch Profile Data

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile?url={value}` | Extract normalized profile from full URL or vanity slug |
| `POST` | `/api/profile` | Extract normalized profile with JSON body `{"url": "..."}` |

#### Example Request:
```bash
curl "http://localhost:8000/api/profile?url=satyanadella"
```

#### Example JSON Response (Abridged):
```json
{
  "first_name": "Priya",
  "last_name": "Sharma",
  "headline": "Senior Staff Backend Engineer @ Stripe | Distributed Systems",
  "summary": "Distinguished backend engineer with 8+ years building mission-critical distributed systems...",
  "public_identifier": "priya-sharma-tech",
  "profile_url": "https://www.linkedin.com/in/priya-sharma-tech/",
  "location": {
    "city": "San Francisco",
    "state": "California",
    "country": "US",
    "display": "San Francisco Bay Area, CA, USA"
  },
  "profile_picture_url": "https://media.licdn.com/dms/image/v2/...",
  "cover_picture_url": "https://media.licdn.com/dms/image/v2/...",
  "positions": [
    {
      "title": "Senior Staff Software Engineer",
      "company_name": "Stripe",
      "location": "San Francisco, CA",
      "description": "Leading the core payment routing platform...",
      "employment_type": "Full-time",
      "date_range": {
        "start_year": 2022,
        "start_month": 3,
        "is_current": true
      }
    }
  ],
  "educations": [
    {
      "school_name": "Carnegie Mellon University",
      "degree_name": "Master of Science",
      "field_of_study": "Computer Science & Distributed Systems"
    }
  ],
  "skills": [
    { "name": "Go" },
    { "name": "Distributed Systems" },
    { "name": "Kafka" }
  ],
  "skills_total": 38,
  "fetched_at": "2026-09-21T14:00:00Z"
}
```

---

### 2. Profile Intelligence & Analytics

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile/intelligence?url={value}` | Compute seniority, completeness score, career tenure, and skills breakdown |
| `POST` | `/api/profile/intelligence` | Compute intelligence via JSON payload |

#### Example Intelligence Output:
```json
{
  "public_identifier": "priya-sharma-tech",
  "full_name": "Priya Sharma",
  "headline": "Senior Staff Backend Engineer @ Stripe",
  "completeness_score": 95,
  "profile_strength": "All-Star",
  "career_metrics": {
    "total_experience_years": 8.5,
    "average_tenure_years": 2.8,
    "total_positions": 3,
    "current_role": "Senior Staff Software Engineer",
    "current_company": "Stripe",
    "seniority_level": "Staff / Principal",
    "stability_index": "High Stability"
  },
  "skill_categories": [
    {
      "category": "Programming Languages",
      "count": 2,
      "skills": ["Go", "Python"]
    },
    {
      "category": "Frameworks & Cloud",
      "count": 4,
      "skills": ["Kafka", "Kubernetes", "Redis", "Docker"]
    }
  ],
  "top_skills": ["Go", "Distributed Systems", "Kafka", "Kubernetes"],
  "optimization_suggestions": [
    "Add quantifiable metrics to your earlier role descriptions."
  ],
  "recruiter_pitch": "Priya Sharma is a Staff / Principal Senior Staff Software Engineer at Stripe with ~8.5 years of demonstrated experience, specializing in Go, Distributed Systems, Python."
}
```

---

### 3. Utility Endpoints

- `GET /health`: Health check (`{"status": "ok"}`)
- `GET /api/demo/profiles`: Returns list of pre-configured demo personas
- `GET /api/session/status`: Verifies cookie status and active mode

---

## Quickstart Guide

### 1. Clone & Setup Virtual Environment

```bash
git clone https://github.com/rahul-1909/LinkedIn-Profile-Intelligence-API.git
cd LinkedIn-Profile-Intelligence-API

# Create and activate virtualenv
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Credentials (Optional)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

If you wish to query live LinkedIn profiles without using the sandbox:
1. Sign in to [linkedin.com](https://www.linkedin.com) in your browser.
2. Open DevTools (**F12**) > **Application** / **Storage** > **Cookies** > `https://www.linkedin.com`.
3. Copy `li_at` and `JSESSIONID` (remove quotes from JSESSIONID).
4. Paste them into `.env`:

```dotenv
LI_AT=AQED...
JSESSIONID=ajax:1234567890
USER_AGENT=Mozilla/5.0 ...
```

> **Note**: Even if you leave `.env` empty, the service will seamlessly run in **Demo Sandbox Mode**, enabling all features and test profiles!

### 4. Start the Application

```bash
uvicorn app.main:app --reload --port 8000
```

- Web Dashboard: [http://localhost:8000/](http://localhost:8000/)
- Interactive API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## Running with Docker

```bash
# Build Docker image
docker build -t linkedin-profile-intelligence-api .

# Run container
docker run -d -p 8000:8000 \
  -e LI_AT="your_cookie" \
  -e JSESSIONID="your_session" \
  --name linkedin-api linkedin-profile-intelligence-api
```

Or using Docker Compose:

```bash
docker compose up -d
```

---

## Testing

Run the comprehensive automated test suite (includes live mocks, error handling, normalization, and intelligence calculations):

```bash
pytest -v
```

Run code formatting and linting:

```bash
ruff check app/ tests/
```

---

## Deploy to Vercel

This repository is optimized for zero-configuration serverless deployment on Vercel:

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `./`.
4. (Optional) Set `LI_AT` and `JSESSIONID` under **Project Settings > Environment Variables**.
5. Deploy! Both the frontend and FastAPI backend will be live on the same URL.

---

## Author & License

Developed with precision by [Rahul](https://github.com/rahul-1909).  
Distributed under the **MIT License**.
