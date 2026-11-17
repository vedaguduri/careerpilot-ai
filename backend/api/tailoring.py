from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from sqlmodel import Session, select
from database import get_session
from models.user import User
from models.job import Job
from models.resume import MasterResume
from models.tailored_resume import TailoredResume, DiffDecisionInput
from api.auth import get_current_user
from services.tailoring_engine import tailoring_engine

router = APIRouter(prefix="/tailoring", tags=["Resume Tailoring"])

@router.post("/generate/{job_id}", response_model=TailoredResume)
def generate_tailored_resume(
    job_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    
    if not master or not master.structured_data:
        raise HTTPException(status_code=400, detail="Please upload or configure your master resume first.")
        
    # Generate tailored version
    tailored = tailoring_engine.generate_tailored_version(
        user_id=current_user.id,
        master_resume_id=master.id,
        master_ast=master.structured_data,
        job=job
    )
    
    session.add(tailored)
    session.commit()
    session.refresh(tailored)
    return tailored

@router.get("/{tailored_id}", response_model=TailoredResume)
def get_tailored_resume(
    tailored_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tailored = session.get(TailoredResume, tailored_id)
    if not tailored or tailored.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tailored resume not found")
    return tailored

@router.post("/{tailored_id}/diff-decision", response_model=TailoredResume)
def decide_diff(
    tailored_id: str,
    decision_in: DiffDecisionInput,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tailored = session.get(TailoredResume, tailored_id)
    if not tailored or tailored.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tailored resume not found")
        
    updated = tailoring_engine.apply_diff_decisions(
        tailored,
        decision_in.diff_id,
        decision_in.decision
    )
    session.add(updated)
    session.commit()
    session.refresh(updated)
    return updated

@router.get("/{tailored_id}/download/tex")
def download_latex_file(
    tailored_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tailored = session.get(TailoredResume, tailored_id)
    if not tailored or tailored.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tailored resume not found")
        
    filename = f"Resume_{tailored.id[:8]}.tex"
    return PlainTextResponse(
        content=tailored.latex_source,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{tailored_id}/download/pdf")
def download_pdf_file(
    tailored_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tailored = session.get(TailoredResume, tailored_id)
    if not tailored or tailored.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tailored resume not found")
        
    if tailored.pdf_file_path and Path(tailored.pdf_file_path).exists():
        return FileResponse(
            tailored.pdf_file_path,
            filename=f"Resume_{tailored.id[:8]}.pdf",
            media_type="application/pdf"
        )
    # If PDF compiler not locally present, return the .tex file directly with friendly header
    return PlainTextResponse(
        content=tailored.latex_source,
        headers={"Content-Disposition": f'attachment; filename="Resume_{tailored.id[:8]}.tex"'}
    )
