from fastapi import APIRouter, Depends, BackgroundTasks
from api.auth import get_current_user
from models.user import User
from services.background_scheduler import background_scheduler

router = APIRouter(prefix="/discovery", tags=["Job Discovery"])

@router.get("/status")
def get_discovery_status(current_user: User = Depends(get_current_user)):
    return background_scheduler.get_sync_status()

@router.post("/trigger")
async def trigger_discovery(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Triggers an asynchronous job discovery and sync cycle across configured job adapters."""
    background_tasks.add_task(background_scheduler.run_discovery_cycle)
    return {
        "message": "Background job discovery cycle initiated across public ATS boards and verified APIs.",
        "status": "running"
    }
