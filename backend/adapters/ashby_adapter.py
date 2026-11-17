import httpx
from typing import List, Dict, Any
from .base import BaseJobAdapter

class AshbyAdapter(BaseJobAdapter):
    source_name = "ashby"

    DEFAULT_COMPANIES = ["linear", "replit", "cursor", "ramp", "perplexity"]

    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for company in self.DEFAULT_COMPANIES:
                if len(results) >= limit:
                    break
                url = f"https://api.ashbyhq.com/posting-api/job-board/{company}"
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        jobs = data.get("jobs", [])
                        for j in jobs:
                            title = j.get("title", "")
                            loc = j.get("location", "Remote")
                            if query and query.lower() not in title.lower():
                                continue
                            results.append({
                                "external_id": f"ash_{j.get('id')}",
                                "company": company.title(),
                                "title": title,
                                "location": loc,
                                "work_arrangement": "remote" if j.get("isRemote") else "hybrid",
                                "employment_type": j.get("employmentType", "Full-time"),
                                "url": j.get("jobUrl"),
                                "application_url": j.get("applyUrl") or j.get("jobUrl"),
                                "description": j.get("descriptionHtml", f"Opportunity at {company.title()}"),
                                "posted_at": j.get("publishedAt")
                            })
                            if len(results) >= limit:
                                break
                except Exception:
                    continue
        return results
