import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class MasterResume(SQLModel, table=True):
    __tablename__ = "master_resumes"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    file_name: str = Field(default="master_resume.pdf")
    file_type: str = Field(default="pdf") # pdf, docx, tex
    file_path: Optional[str] = Field(default=None) # Raw file path preserved
    raw_text: str = Field(default="")
    
    # Structured Master AST Representation
    structured_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    version_number: int = Field(default=1)
    is_current: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ResumeVersion(SQLModel, table=True):
    __tablename__ = "resume_versions"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    master_resume_id: str = Field(foreign_key="master_resumes.id", index=True, nullable=False)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    version_number: int = Field(nullable=False)
    change_summary: str = Field(default="Updated master resume")
    structured_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utc_now)

class MasterResumeUpdate(SQLModel):
    structured_data: Dict[str, Any]
    change_summary: Optional[str] = "Manual resume edit"
