import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class TailoredResume(SQLModel, table=True):
    __tablename__ = "tailored_resumes"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    job_id: str = Field(foreign_key="jobs.id", index=True, nullable=False)
    master_resume_id: str = Field(foreign_key="master_resumes.id", nullable=False)
    
    version_name: str = Field(default="Tailored Resume")
    tailored_structured_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Granular diff approval records
    diff_summary: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    
    latex_source: str = Field(default="")
    pdf_file_path: Optional[str] = Field(default=None)
    compilation_status: str = Field(default="pending") # pending, compiled, error
    compilation_logs: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class DiffDecisionInput(SQLModel):
    diff_id: str
    decision: str # "accepted" or "rejected"
