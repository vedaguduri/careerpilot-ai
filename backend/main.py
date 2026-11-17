from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from config import settings
from database import init_db, engine
from api import api_router
from seed_data import seed_initial_jobs
from models.job import Job

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed verified jobs if needed
    init_db()
    with Session(engine) as session:
        job_count = session.exec(select(Job)).all()
        if len(job_count) == 0:
            seed_initial_jobs()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CareerPilot AI: Intelligent, personalized job discovery, truthful resume tailoring, and application tracking platform.",
    lifespan=lifespan
)

# CORS middleware for modern frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for local dev across ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
