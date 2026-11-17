import os
import httpx
from typing import List, Dict, Any
from .base import BaseJobAdapter

class AdzunaAdapter(BaseJobAdapter):
    source_name = "adzuna"

    def __init__(self):
        self.app_id = os.getenv("ADZUNA_APP_ID", "")
        self.app_key = os.getenv("ADZUNA_APP_KEY", "")

    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        if not self.app_id or not self.app_key:
            return [] # Safely return empty list if user hasn't configured authorized credentials
            
        results = []
        country = "in" if "india" in location.lower() else "us"
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": limit,
            "what": query or "software engineer"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("results", []):
                        results.append({
                            "external_id": f"adz_{item.get('id')}",
                            "company": item.get("company", {}).get("display_name", "Technology Employer"),
                            "title": item.get("title", ""),
                            "location": item.get("location", {}).get("display_name", "Remote"),
                            "work_arrangement": "remote" if "remote" in item.get("title", "").lower() else "hybrid",
                            "employment_type": "full-time",
                            "url": item.get("redirect_url"),
                            "application_url": item.get("redirect_url"),
                            "description": item.get("description", ""),
                            "min_salary": item.get("salary_min"),
                            "max_salary": item.get("salary_max"),
                            "posted_at": item.get("created")
                        })
        except Exception:
            pass
        return results

class ManualImportAdapter(BaseJobAdapter):
    source_name = "manual_import"

    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        # Manual adapter processes user-supplied links on-demand
        return []
