import httpx
from typing import List, Dict, Any
from .base import BaseJobAdapter

class GreenhouseAdapter(BaseJobAdapter):
    source_name = "greenhouse"

    # Default registry of high-reputation tech companies using Greenhouse
    DEFAULT_COMPANIES = [
        "cloudflare", "figma", "datadog", "stripe", "gitlab", "razorpay"
    ]

    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for company in self.DEFAULT_COMPANIES:
                if len(results) >= limit:
                    break
                url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        jobs = data.get("jobs", [])
                        for j in jobs:
                            title = j.get("title", "")
                            loc = j.get("location", {}).get("name", "Remote")
                            # Filter by query if provided
                            if query and query.lower() not in title.lower():
                                continue
                            results.append({
                                "external_id": f"gh_{j.get('id')}",
                                "company": company.title(),
                                "title": title,
                                "location": loc,
                                "work_arrangement": "remote" if "remote" in loc.lower() else "hybrid",
                                "employment_type": "full-time",
                                "url": j.get("absolute_url"),
                                "application_url": j.get("absolute_url"),
                                "description": f"Exciting engineering opportunity at {company.title()} for {title}.",
                                "posted_at": j.get("updated_at")
                            })
                            if len(results) >= limit:
                                break
                except Exception:
                    # Non-blocking on network timeout
                    continue
        return results
