import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlmodel import Session, select
from database import engine
from models.job import Job
from models.resume import MasterResume
from models.matching import JobMatchScore
from services.job_normalizer import job_normalizer
from services.matching_engine import matching_engine
from adapters import ADAPTERS

def utc_now():
    return datetime.now(timezone.utc)

class BackgroundJobScheduler:
    """Orchestrates periodic background job discovery, multi-source ingestion, deduplication, and pre-computed matching."""

    _is_running = False
    _last_sync_time: datetime = None
    _last_sync_stats: Dict[str, Any] = {
        "discovered": 0,
        "new_inserted": 0,
        "duplicates_skipped": 0,
        "errors": []
    }

    @classmethod
    def get_sync_status(cls) -> Dict[str, Any]:
        return {
            "is_running": cls._is_running,
            "last_sync_time": cls._last_sync_time.isoformat() if cls._last_sync_time else None,
            "last_sync_stats": cls._last_sync_stats
        }

    @classmethod
    async def run_discovery_cycle(cls, query: str = "", location: str = ""):
        """Executes one end-to-end multi-source discovery, normalization, deduplication, and pre-matching cycle."""
        if cls._is_running:
            return cls._last_sync_stats

        cls._is_running = True
        stats = {"discovered": 0, "new_inserted": 0, "duplicates_skipped": 0, "errors": []}

        try:
            with Session(engine) as session:
                for adapter in ADAPTERS:
                    try:
                        raw_jobs = await adapter.fetch_jobs(query=query, location=location, limit=15)
                        stats["discovered"] += len(raw_jobs)
                        
                        for item in raw_jobs:
                            normalized = job_normalizer.normalize_job_dict(item, adapter.source_name)
                            
                            # Deduplication Check
                            existing = session.exec(select(Job).where(Job.dedup_hash == normalized.dedup_hash)).first()
                            if existing:
                                existing.last_seen_at = utc_now()
                                existing.availability_status = "active"
                                session.add(existing)
                                stats["duplicates_skipped"] += 1
                            else:
                                session.add(normalized)
                                session.commit()
                                session.refresh(normalized)
                                stats["new_inserted"] += 1
                                
                                # Pre-compute matches for users with active master resumes
                                active_resumes = session.exec(select(MasterResume).where(MasterResume.is_current == True)).all()
                                for res in active_resumes:
                                    match_score = matching_engine.calculate_match(
                                        user_id=res.user_id,
                                        job=normalized,
                                        master_ast=res.structured_data
                                    )
                                    session.add(match_score)
                                session.commit()
                    except Exception as e:
                        stats["errors"].append(f"{adapter.source_name}: {str(e)}")

                session.commit()
                cls._last_sync_time = utc_now()
                cls._last_sync_stats = stats
        finally:
            cls._is_running = False

        return stats

background_scheduler = BackgroundJobScheduler()
