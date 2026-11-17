import uuid
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from database import engine
from models.job import Job
from services.job_normalizer import job_normalizer

def utc_now():
    return datetime.now(timezone.utc)

now = utc_now()

SEED_JOBS = [
    {
        "external_id": "gh_stripe_eng_01",
        "source": "greenhouse",
        "company": "Stripe",
        "title": "Senior Backend Engineer - Global Payouts",
        "location": "Bengaluru, India (Hybrid)",
        "country": "India",
        "work_arrangement": "hybrid",
        "employment_type": "full-time",
        "min_salary": 4500000,
        "max_salary": 7000000,
        "salary_currency": "INR",
        "application_url": "https://stripe.com/jobs/listing/global-payouts-eng",
        "source_url": "https://stripe.com/jobs",
        "description": "Stripe is looking for a Senior Backend Engineer to scale our global payouts and payment infrastructure. You will architect low-latency distributed systems processing billions of dollars in daily transactions with high reliability.",
        "extracted_skills": ["Python", "Go", "Distributed Systems", "SQL", "PostgreSQL", "Kafka", "AWS", "Microservices"],
        "required_experience_years": 5.0,
        "posted_at": now - timedelta(days=2)
    },
    {
        "external_id": "gh_cloudflare_platform_02",
        "source": "greenhouse",
        "company": "Cloudflare",
        "title": "Systems Engineer - Edge Computing & Workers",
        "location": "Remote - India",
        "country": "India",
        "work_arrangement": "remote",
        "employment_type": "full-time",
        "min_salary": 3800000,
        "max_salary": 5800000,
        "salary_currency": "INR",
        "application_url": "https://cloudflare.com/careers/edge-systems-eng",
        "source_url": "https://cloudflare.com/careers",
        "description": "Join Cloudflare to build the future of edge computing. We are seeking a Systems Engineer with deep expertise in distributed networks, low-latency API gateways, and asynchronous runtime environments.",
        "extracted_skills": ["Go", "Rust", "Python", "Docker", "Kubernetes", "Linux", "REST APIs", "CI/CD"],
        "required_experience_years": 4.0,
        "posted_at": now - timedelta(days=1)
    },
    {
        "external_id": "ash_linear_fullstack_03",
        "source": "ashby",
        "company": "Linear",
        "title": "Product Engineer - Real-Time Collaboration",
        "location": "Remote - Global",
        "country": "Global",
        "work_arrangement": "remote",
        "employment_type": "full-time",
        "min_salary": 140000,
        "max_salary": 190000,
        "salary_currency": "USD",
        "application_url": "https://linear.app/careers/product-engineer",
        "source_url": "https://linear.app/careers",
        "description": "Linear builds tools for high-performance software teams. We are seeking a Product Engineer passionate about snappy interfaces, real-time sync engines, and craftsmanship. You will build user-facing features end-to-end.",
        "extracted_skills": ["TypeScript", "React", "Node.js", "GraphQL", "PostgreSQL", "Tailwind CSS", "System Design"],
        "required_experience_years": 4.0,
        "posted_at": now - timedelta(hours=14)
    },
    {
        "external_id": "gh_datadog_infra_04",
        "source": "greenhouse",
        "company": "Datadog",
        "title": "Software Engineer II - Cloud Integrations",
        "location": "Hyderabad, India",
        "country": "India",
        "work_arrangement": "hybrid",
        "employment_type": "full-time",
        "min_salary": 2800000,
        "max_salary": 4200000,
        "salary_currency": "INR",
        "application_url": "https://careers.datadoghq.com/detail/cloud-integrations-eng",
        "source_url": "https://careers.datadoghq.com",
        "description": "Datadog is looking for a Software Engineer to expand our cloud monitoring integrations across AWS, Azure, and GCP. You will design scalable telemetry ingestion pipelines handling petabytes of data.",
        "extracted_skills": ["Python", "Go", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Redis"],
        "required_experience_years": 3.0,
        "posted_at": now - timedelta(days=3)
    },
    {
        "external_id": "lev_postman_api_05",
        "source": "lever",
        "company": "Postman",
        "title": "Lead API Platform Architect",
        "location": "Bengaluru, India",
        "country": "India",
        "work_arrangement": "hybrid",
        "employment_type": "full-time",
        "min_salary": 5000000,
        "max_salary": 7500000,
        "salary_currency": "INR",
        "application_url": "https://postman.com/careers/lead-platform-architect",
        "source_url": "https://postman.com/careers",
        "description": "Postman is looking for a Lead Platform Architect to guide technical strategy for our developer tools platform used by 30M+ developers worldwide. You will lead architectural evolution and high-scale API design.",
        "extracted_skills": ["Node.js", "TypeScript", "Python", "Microservices", "REST APIs", "AWS", "System Design", "Kafka"],
        "required_experience_years": 7.0,
        "posted_at": now - timedelta(days=4)
    },
    {
        "external_id": "ash_cursor_ai_06",
        "source": "ashby",
        "company": "Anysphere (Cursor)",
        "title": "AI Systems Engineer - Code Intelligence",
        "location": "San Francisco, CA / Remote",
        "country": "United States",
        "work_arrangement": "remote",
        "employment_type": "full-time",
        "min_salary": 180000,
        "max_salary": 260000,
        "salary_currency": "USD",
        "application_url": "https://cursor.com/careers/ai-systems",
        "source_url": "https://cursor.com/careers",
        "description": "Cursor is the AI-first code editor. We are looking for an AI Systems Engineer to build high-performance inference pipelines, context retrieval engines, and fast language server integrations.",
        "extracted_skills": ["Python", "C++", "TypeScript", "PyTorch", "FastAPI", "Docker", "System Design"],
        "required_experience_years": 3.0,
        "posted_at": now - timedelta(hours=6)
    },
    {
        "external_id": "gh_razorpay_platform_07",
        "source": "greenhouse",
        "company": "Razorpay",
        "title": "Senior Software Engineer - Banking Platform",
        "location": "Bengaluru, India",
        "country": "India",
        "work_arrangement": "onsite",
        "employment_type": "full-time",
        "min_salary": 3200000,
        "max_salary": 4800000,
        "salary_currency": "INR",
        "application_url": "https://razorpay.com/jobs/banking-platform-eng",
        "source_url": "https://razorpay.com/jobs",
        "description": "Razorpay powers payments for millions of businesses in India. As a Senior Engineer on Banking Platform, you will build core banking APIs with high transaction concurrency and bank-grade resilience.",
        "extracted_skills": ["Go", "Python", "SQL", "MySQL", "Redis", "Kafka", "Microservices", "Docker"],
        "required_experience_years": 4.0,
        "posted_at": now - timedelta(days=2)
    },
    {
        "external_id": "ash_perplexity_eng_08",
        "source": "ashby",
        "company": "Perplexity AI",
        "title": "Full Stack Engineer - Search & Discovery",
        "location": "San Francisco, CA (Hybrid)",
        "country": "United States",
        "work_arrangement": "hybrid",
        "employment_type": "full-time",
        "min_salary": 160000,
        "max_salary": 220000,
        "salary_currency": "USD",
        "application_url": "https://perplexity.ai/careers/fullstack-search",
        "source_url": "https://perplexity.ai/careers",
        "description": "Perplexity is revolutionizing knowledge discovery through conversational search. We need a Full Stack Engineer to build fast, beautiful consumer search experiences and streaming response engines.",
        "extracted_skills": ["TypeScript", "React", "Next.js", "Python", "FastAPI", "Tailwind CSS", "REST APIs"],
        "required_experience_years": 3.0,
        "posted_at": now - timedelta(days=1)
    }
]

def seed_initial_jobs():
    with Session(engine) as session:
        for raw in SEED_JOBS:
            dedup_hash = job_normalizer.compute_dedup_hash(raw["company"], raw["title"], raw["location"])
            existing = session.exec(select(Job).where(Job.dedup_hash == dedup_hash)).first()
            if not existing:
                job = Job(
                    id=str(uuid.uuid4()),
                    external_id=raw["external_id"],
                    source=raw["source"],
                    source_url=raw["source_url"],
                    application_url=raw["application_url"],
                    title=raw["title"],
                    company=raw["company"],
                    location=raw["location"],
                    country=raw["country"],
                    work_arrangement=raw["work_arrangement"],
                    employment_type=raw["employment_type"],
                    min_salary=raw["min_salary"],
                    max_salary=raw["max_salary"],
                    salary_currency=raw["salary_currency"],
                    description=raw["description"],
                    extracted_skills=raw["extracted_skills"],
                    required_experience_years=raw["required_experience_years"],
                    dedup_hash=dedup_hash,
                    posted_at=raw["posted_at"],
                    first_seen_at=now - timedelta(days=1),
                    last_seen_at=now,
                    posting_date_confidence="exact_source",
                    availability_status="active"
                )
                session.add(job)
        session.commit()

if __name__ == "__main__":
    from database import init_db
    init_db()
    seed_initial_jobs()
    print("Initial verified job seed completed successfully!")
