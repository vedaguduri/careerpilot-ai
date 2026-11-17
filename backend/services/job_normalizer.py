import re
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from models.job import Job

def utc_now():
    return datetime.now(timezone.utc)

class JobNormalizer:
    """Normalizes heterogenous job sources into a unified schema, computes deduplication hashes, and verifies freshness."""

    @classmethod
    def compute_dedup_hash(cls, company: str, title: str, location: str) -> str:
        c_clean = re.sub(r'[^a-z0-9]', '', (company or "").lower())
        t_clean = re.sub(r'[^a-z0-9]', '', (title or "").lower())
        l_clean = "remote" if "remote" in (location or "").lower() else re.sub(r'[^a-z0-9]', '', (location or "").lower())
        raw_key = f"{c_clean}:{t_clean}:{l_clean}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    @classmethod
    def normalize_work_arrangement(cls, text: str, location: str) -> str:
        combined = f"{text} {location}".lower()
        if "remote" in combined or "work from home" in combined or "wfh" in combined:
            return "remote"
        if "hybrid" in combined or "flexible" in combined:
            return "hybrid"
        return "onsite"

    @classmethod
    def extract_skills_from_text(cls, text: str) -> List[str]:
        known_tokens = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Django", "Go",
            "Java", "Spring Boot", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker",
            "Kubernetes", "AWS", "GCP", "Azure", "Git", "GraphQL", "REST APIs", "CI/CD",
            "Kafka", "Elasticsearch", "Tailwind CSS", "Next.js", "C++", "Rust", "TensorFlow",
            "PyTorch", "Microservices", "System Design", "Linux", "Terraform", "Vue", "Angular"
        ]
        found = {}
        for token in known_tokens:
            if re.search(r'\b' + re.escape(token) + r'\b', text, re.IGNORECASE):
                found[token.lower()] = token
        return sorted(list(found.values()))

    @classmethod
    def normalize_job_dict(cls, raw: Dict[str, Any], source: str) -> Job:
        title = raw.get("title", "Software Engineer").strip()
        company = raw.get("company", "Technology Company").strip()
        location = raw.get("location", "Remote").strip()
        description = raw.get("description", "").strip()
        application_url = raw.get("application_url") or raw.get("url") or ""
        source_url = raw.get("source_url") or application_url
        
        work_arrangement = cls.normalize_work_arrangement(raw.get("work_arrangement", ""), location)
        dedup_hash = cls.compute_dedup_hash(company, title, location)
        extracted_skills = cls.extract_skills_from_text(f"{title} {description}")

        # Posting date check
        posted_at = raw.get("posted_at")
        confidence = "exact_source" if posted_at else "discovered_date"
        
        # Country determination
        country = "Global"
        loc_lower = location.lower()
        if any(c in loc_lower for c in ["india", "bangalore", "bengaluru", "hyderabad", "pune", "mumbai", "delhi", "noida", "gurgaon"]):
            country = "India"
        elif any(c in loc_lower for c in ["usa", "united states", "san francisco", "new york", "seattle", "austin"]):
            country = "United States"

        return Job(
            external_id=str(raw.get("external_id") or raw.get("id") or dedup_hash[:16]),
            source=source,
            source_url=source_url,
            application_url=application_url,
            title=title,
            company=company,
            company_logo_url=raw.get("company_logo_url"),
            location=location,
            country=country,
            work_arrangement=work_arrangement,
            employment_type=raw.get("employment_type", "full-time"),
            min_salary=raw.get("min_salary"),
            max_salary=raw.get("max_salary"),
            salary_currency=raw.get("salary_currency", "USD" if country != "India" else "INR"),
            description=description,
            extracted_skills=extracted_skills,
            required_experience_years=raw.get("required_experience_years", 3.0),
            dedup_hash=dedup_hash,
            posted_at=posted_at,
            first_seen_at=utc_now(),
            last_seen_at=utc_now(),
            posting_date_confidence=confidence,
            availability_status="active"
        )

job_normalizer = JobNormalizer()
