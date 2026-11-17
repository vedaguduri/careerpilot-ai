import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class Job(SQLModel, table=True):
    __tablename__ = "jobs"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    external_id: str = Field(index=True, nullable=False)
    source: str = Field(index=True, nullable=False) # greenhouse, lever, ashby, adzuna, jooble, company_career, manual_import
    source_url: str = Field(default="")
    application_url: str = Field(default="")
    title: str = Field(index=True, nullable=False)
    company: str = Field(index=True, nullable=False)
    company_logo_url: Optional[str] = Field(default=None)
    location: str = Field(index=True, default="Remote")
    country: str = Field(default="Global") # India, US, Global, etc.
    work_arrangement: str = Field(default="remote") # remote, hybrid, onsite
    employment_type: str = Field(default="full-time") # full-time, contract, internship
    
    min_salary: Optional[int] = Field(default=None)
    max_salary: Optional[int] = Field(default=None)
    salary_currency: Optional[str] = Field(default=None)
    
    description: str = Field(default="")
    extracted_skills: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    required_experience_years: Optional[float] = Field(default=None)
    
    # Deduplication SHA-256 hash
    dedup_hash: str = Field(index=True, nullable=False)
    
    # Freshness and timeline
    posted_at: Optional[datetime] = Field(default=None)
    first_seen_at: datetime = Field(default_factory=utc_now)
    last_seen_at: datetime = Field(default_factory=utc_now)
    closed_at: Optional[datetime] = Field(default=None)
    posting_date_confidence: str = Field(default="discovered_date") # exact_source, estimated, discovered_date
    availability_status: str = Field(default="active") # active, unverified, closed

class ManualJobCreate(SQLModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    work_arrangement: Optional[str] = "remote"
    employment_type: Optional[str] = "full-time"
    application_url: Optional[str] = ""
    description: str
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: Optional[str] = "USD"
