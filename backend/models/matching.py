import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class JobMatchScore(SQLModel, table=True):
    __tablename__ = "job_match_scores"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    job_id: str = Field(foreign_key="jobs.id", index=True, nullable=False)
    
    overall_score: int = Field(default=0) # 0 to 100
    skills_score: int = Field(default=0)
    experience_score: int = Field(default=0)
    role_relevance_score: int = Field(default=0)
    
    matching_skills: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    missing_required_skills: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    preferred_skills_possessed: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    relevant_projects: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    scoring_methodology_breakdown: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    improvement_suggestions: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=utc_now)
