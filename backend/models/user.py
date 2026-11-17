import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

def utc_now():
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    full_name: str = Field(default="CareerPilot User")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class UserCreate(SQLModel):
    email: str
    password: str
    full_name: Optional[str] = "CareerPilot User"

class UserLogin(SQLModel):
    email: str
    password: str

class UserResponse(SQLModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
