import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session, select
from config import settings
from database import get_session
from models.user import User
from models.resume import MasterResume, ResumeVersion, MasterResumeUpdate
from api.auth import get_current_user
from services.resume_parser import resume_parser
from services.matching_engine import matching_engine
from models.job import Job
from models.matching import JobMatchScore

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"
    if ext not in ["pdf", "docx", "doc", "tex", "txt"]:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, DOCX, LaTeX (.tex), TXT")
        
    safe_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    saved_path = settings.UPLOADS_DIR / safe_filename
    
    # Save raw file preserving original
    content = await file.read()
    with open(saved_path, 'wb') as out_file:
        out_file.write(content)
        
    # Extract raw text and parse to AST
    raw_text = resume_parser.extract_text_from_file(str(saved_path), ext)
    structured_ast = resume_parser.parse_to_structured_ast(raw_text)
    
    # Archive any previous master resume version
    existing_master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    
    new_version_num = 1
    if existing_master:
        new_version_num = existing_master.version_number + 1
        existing_master.is_current = False
        session.add(existing_master)
        
        # Save snapshot to version history
        ver = ResumeVersion(
            master_resume_id=existing_master.id,
            user_id=current_user.id,
            version_number=existing_master.version_number,
            change_summary=f"Replaced by new upload: {file.filename}",
            structured_data=existing_master.structured_data
        )
        session.add(ver)

    new_master = MasterResume(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=ext,
        file_path=str(saved_path),
        raw_text=raw_text,
        structured_data=structured_ast,
        version_number=new_version_num,
        is_current=True
    )
    session.add(new_master)
    session.commit()
    session.refresh(new_master)
    
    # Trigger instant match scores calculation for active jobs
    jobs = session.exec(select(Job).where(Job.availability_status == "active")).all()
    for j in jobs:
        m = matching_engine.calculate_match(current_user.id, j, structured_ast)
        session.add(m)
    session.commit()
    
    return {
        "message": "Resume parsed and structured master AST generated successfully",
        "master_resume": new_master
    }

@router.get("/master")
def get_master_resume(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    return master or {"structured_data": None}

@router.put("/master")
def update_master_resume(
    update_data: MasterResumeUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    
    if not master:
        # Create initial master if none existed
        master = MasterResume(
            user_id=current_user.id,
            file_name="Master Resume.txt",
            file_type="txt",
            structured_data=update_data.structured_data,
            version_number=1,
            is_current=True
        )
        session.add(master)
    else:
        # Save snapshot of previous state to version history
        ver = ResumeVersion(
            master_resume_id=master.id,
            user_id=current_user.id,
            version_number=master.version_number,
            change_summary=update_data.change_summary or "Manual correction",
            structured_data=master.structured_data
        )
        session.add(ver)
        
        master.version_number += 1
        master.structured_data = update_data.structured_data
        session.add(master)

    session.commit()
    session.refresh(master)
    
    # Refresh matches for user
    jobs = session.exec(select(Job).where(Job.availability_status == "active")).all()
    for j in jobs:
        m = matching_engine.calculate_match(current_user.id, j, master.structured_data)
        session.add(m)
    session.commit()
    
    return master

@router.get("/versions")
def get_resume_versions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    versions = session.exec(
        select(ResumeVersion)
        .where(ResumeVersion.user_id == current_user.id)
        .order_by(ResumeVersion.version_number.desc())
    ).all()
    return versions
