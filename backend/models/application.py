import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

def utc_now():
    return datetime.now(timezone.utc)

class ApplicationRecord(SQLModel, table=True):
    __tablename__ = "application_records"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    job_id: str = Field(foreign_key="jobs.id", index=True, nullable=False)
    tailored_resume_id: Optional[str] = Field(default=None, foreign_key="tailored_resumes.id")
    
    status: str = Field(default="saved") # interested, saved, preparing, applied, assessment, interview, rejected, offer, archived
    applied_at: Optional[datetime] = Field(default=None)
    interview_at: Optional[datetime] = Field(default=None)
    notes: str = Field(default="")
    custom_application_url: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ApplicationRecordCreate(SQLModel):
    job_id: str
    status: Optional[str] = "saved"
    notes: Optional[str] = ""
    tailored_resume_id: Optional[str] = None
    custom_application_url: Optional[str] = None

class ApplicationRecordUpdate(SQLModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    interview_at: Optional[datetime] = None
    tailored_resume_id: Optional[str] = None
    custom_application_url: Optional[str] = None
