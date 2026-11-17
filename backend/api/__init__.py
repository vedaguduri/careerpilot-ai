from fastapi import APIRouter
from .auth import router as auth_router
from .preferences import router as preferences_router
from .resumes import router as resumes_router
from .jobs import router as jobs_router
from .tailoring import router as tailoring_router
from .ai_providers import router as ai_providers_router
from .applications import router as applications_router
from .discovery import router as discovery_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(preferences_router)
api_router.include_router(resumes_router)
api_router.include_router(jobs_router)
api_router.include_router(tailoring_router)
api_router.include_router(ai_providers_router)
api_router.include_router(applications_router)
api_router.include_router(discovery_router)
