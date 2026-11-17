import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, col
from database import get_session
from models.user import User
from models.job import Job, ManualJobCreate
from models.matching import JobMatchScore
from models.resume import MasterResume
from api.auth import get_current_user
from services.job_normalizer import job_normalizer
from services.matching_engine import matching_engine

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("")
def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    work_arrangement: Optional[str] = None,
    source: Optional[str] = None,
    country: Optional[str] = None,
    min_score: Optional[int] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Job).where(Job.availability_status == "active")
    
    if q:
        query = query.where(
            (col(Job.title).ilike(f"%{q}%")) |
            (col(Job.company).ilike(f"%{q}%")) |
            (col(Job.description).ilike(f"%{q}%"))
        )
    if location:
        query = query.where(col(Job.location).ilike(f"%{location}%"))
    if work_arrangement and work_arrangement != "all":
        query = query.where(Job.work_arrangement == work_arrangement.lower())
    if source and source != "all":
        query = query.where(Job.source == source.lower())
    if country and country != "all":
        query = query.where(col(Job.country).ilike(f"%{country}%"))
        
    query = query.order_by(Job.first_seen_at.desc()).offset(offset).limit(limit)
    jobs = session.exec(query).all()
    
    # Attach match scores for this user
    enriched_jobs = []
    for job in jobs:
        score_record = session.exec(
            select(JobMatchScore)
            .where(JobMatchScore.user_id == current_user.id)
            .where(JobMatchScore.job_id == job.id)
            .order_by(JobMatchScore.created_at.desc())
        ).first()
        
        match_info = {
            "overall_score": score_record.overall_score if score_record else 75,
            "matching_skills": score_record.matching_skills if score_record else job.extracted_skills[:3],
            "missing_required_skills": score_record.missing_required_skills if score_record else [],
        }
        
        if min_score and match_info["overall_score"] < min_score:
            continue
            
        enriched_jobs.append({
            **job.model_dump(),
            "match": match_info
        })
        
    return enriched_jobs

@router.get("/recommendations")
def get_recommended_jobs(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Returns top personalized job recommendations prepared for returning or onboarding users."""
    master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    
    jobs = session.exec(select(Job).where(Job.availability_status == "active").order_by(Job.first_seen_at.desc())).all()
    
    scored_jobs = []
    for j in jobs:
        score = session.exec(
            select(JobMatchScore)
            .where(JobMatchScore.user_id == current_user.id)
            .where(JobMatchScore.job_id == j.id)
            .order_by(JobMatchScore.created_at.desc())
        ).first()
        
        if not score and master:
            score = matching_engine.calculate_match(current_user.id, j, master.structured_data)
            session.add(score)
            session.commit()
            
        overall = score.overall_score if score else 70
        scored_jobs.append({
            **j.model_dump(),
            "match": {
                "overall_score": overall,
                "skills_score": score.skills_score if score else 70,
                "matching_skills": score.matching_skills if score else j.extracted_skills[:3],
                "missing_required_skills": score.missing_required_skills if score else [],
                "scoring_breakdown": score.scoring_methodology_breakdown if score else {}
            }
        })
        
    scored_jobs.sort(key=lambda x: x["match"]["overall_score"], reverse=True)
    return scored_jobs[:20]

@router.get("/{job_id}")
def get_job_detail(
    job_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    score = session.exec(
        select(JobMatchScore)
        .where(JobMatchScore.user_id == current_user.id)
        .where(JobMatchScore.job_id == job.id)
        .order_by(JobMatchScore.created_at.desc())
    ).first()
    
    return {
        "job": job,
        "match": score
    }

@router.post("/manual-import")
def manual_import_job(
    job_in: ManualJobCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Allows user to paste a job description and application URL for instant matching and tailoring."""
    raw_dict = job_in.model_dump()
    raw_dict["url"] = job_in.application_url or ""
    raw_dict["id"] = f"manual_{uuid.uuid4().hex[:8]}"
    
    normalized = job_normalizer.normalize_job_dict(raw_dict, "manual_import")
    
    # Check if existing
    existing = session.exec(select(Job).where(Job.dedup_hash == normalized.dedup_hash)).first()
    if existing:
        return existing
        
    session.add(normalized)
    session.commit()
    session.refresh(normalized)
    
    # Compute match if master resume present
    master = session.exec(
        select(MasterResume)
        .where(MasterResume.user_id == current_user.id)
        .where(MasterResume.is_current == True)
    ).first()
    if master:
        m = matching_engine.calculate_match(current_user.id, normalized, master.structured_data)
        session.add(m)
        session.commit()
        
    return normalized
