import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

def utc_now():
    return datetime.now(timezone.utc)

class AIProviderKey(SQLModel, table=True):
    __tablename__ = "ai_provider_keys"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    provider: str = Field(index=True, nullable=False) # gemini, groq, openrouter, cerebras, mistral, openai, ollama, custom
    encrypted_api_key: str = Field(nullable=False)
    key_fingerprint: str = Field(nullable=False) # e.g. "sk-...9a1f"
    base_url: Optional[str] = Field(default=None) # for Ollama or OpenAI-compatible custom endpoints
    is_active: bool = Field(default=True)
    selected_models: Dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    monthly_spend_limit_usd: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class AIProviderConfigInput(SQLModel):
    provider: str
    api_key: Optional[str] = None # Plaintext only on incoming submit, never stored or returned
    base_url: Optional[str] = None
    selected_models: Optional[Dict[str, str]] = None
    monthly_spend_limit_usd: Optional[float] = 0.0

class AIProviderResponse(SQLModel):
    id: str
    provider: str
    key_fingerprint: str
    base_url: Optional[str] = None
    is_active: bool
    selected_models: Dict[str, str]
    monthly_spend_limit_usd: float
    updated_at: datetime
