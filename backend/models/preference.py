import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class UserPreference(SQLModel, table=True):
    __tablename__ = "user_preferences"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, unique=True, nullable=False)
    
    # Preferences stored in JSON columns
    desired_roles: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    preferred_locations: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    experience_level: str = Field(default="mid") # entry, mid, senior, lead, principal
    work_arrangements: List[str] = Field(default_factory=lambda: ["remote", "hybrid"], sa_column=Column(JSON))
    min_salary: Optional[int] = Field(default=None)
    preferred_currency: str = Field(default="INR") # INR, USD, EUR, etc.
    preferred_industries: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    target_companies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    discovery_frequency_hours: int = Field(default=12)
    updated_at: datetime = Field(default_factory=utc_now)

class UserPreferenceUpdate(SQLModel):
    desired_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[str] = None
    work_arrangements: Optional[List[str]] = None
    min_salary: Optional[int] = None
    preferred_currency: Optional[str] = None
    preferred_industries: Optional[List[str]] = None
    target_companies: Optional[List[str]] = None
    discovery_frequency_hours: Optional[int] = None
