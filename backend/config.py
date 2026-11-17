import os
from pathlib import Path
from pydantic import BaseModel

raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{Path(__file__).resolve().parent / 'careerpilot.db'}")
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings(BaseModel):
    PROJECT_NAME: str = "CareerPilot AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    DATA_DIR: Path = Path(__file__).resolve().parent / "data"
    UPLOADS_DIR: Path = Path(__file__).resolve().parent / "data" / "uploads"
    GENERATED_DIR: Path = Path(__file__).resolve().parent / "data" / "generated"
    
    # Database (Defaults to SQLite for local dev; easily set to Neon/PostgreSQL in production)
    DATABASE_URL: str = raw_db_url
    
    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "careerpilot_super_secret_dev_key_2026_x87dfa")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AES-256 Master Key for BYOK Vault
    VAULT_MASTER_KEY: str = os.getenv("VAULT_MASTER_KEY", "cp_vault_master_key_secure_salt_739218")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

settings = Settings()

# Ensure runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
