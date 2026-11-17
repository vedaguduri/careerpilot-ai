from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models.user import User
from models.job import Job
from models.tailored_resume import TailoredResume
from models.application import ApplicationRecord, ApplicationRecordCreate, ApplicationRecordUpdate
from api.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["Application Tracker"])

@router.get("")
def list_applications(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(ApplicationRecord).where(ApplicationRecord.user_id == current_user.id)
    if status and status != "all":
        query = query.where(ApplicationRecord.status == status.lower())
    query = query.order_by(ApplicationRecord.updated_at.desc())
    records = session.exec(query).all()
    
    # Enrich with job details and tailored resume details
    enriched = []
    for rec in records:
        job = session.get(Job, rec.job_id)
        tailored = session.get(TailoredResume, rec.tailored_resume_id) if rec.tailored_resume_id else None
        enriched.append({
            **rec.model_dump(),
            "job": job,
            "tailored_resume": {
                "id": tailored.id,
                "version_name": tailored.version_name,
                "pdf_file_path": tailored.pdf_file_path
            } if tailored else None
        })
    return enriched

@router.post("", response_model=ApplicationRecord)
def create_application_record(
    app_in: ApplicationRecordCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if already tracked
    existing = session.exec(
        select(ApplicationRecord)
        .where(ApplicationRecord.user_id == current_user.id)
        .where(ApplicationRecord.job_id == app_in.job_id)
    ).first()
    
    if existing:
        existing.status = app_in.status or existing.status
        if app_in.notes:
            existing.notes = app_in.notes
        if app_in.tailored_resume_id:
            existing.tailored_resume_id = app_in.tailored_resume_id
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
        
    rec = ApplicationRecord(
        user_id=current_user.id,
        job_id=app_in.job_id,
        status=app_in.status or "saved",
        notes=app_in.notes or "",
        tailored_resume_id=app_in.tailored_resume_id,
        custom_application_url=app_in.custom_application_url,
        applied_at=datetime.now(timezone.utc) if app_in.status == "applied" else None
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

@router.put("/{record_id}", response_model=ApplicationRecord)
def update_application_record(
    record_id: str,
    update_data: ApplicationRecordUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    rec = session.get(ApplicationRecord, record_id)
    if not rec or rec.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application record not found")
        
    for k, v in update_data.model_dump(exclude_unset=True).items():
        if k == "status" and v == "applied" and not rec.applied_at:
            rec.applied_at = datetime.now(timezone.utc)
        setattr(rec, k, v)
        
    rec.updated_at = datetime.now(timezone.utc)
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

@router.delete("/{record_id}")
def delete_application_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    rec = session.get(ApplicationRecord, record_id)
    if not rec or rec.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application record not found")
        
    session.delete(rec)
    session.commit()
    return {"message": "Application record removed successfully"}
