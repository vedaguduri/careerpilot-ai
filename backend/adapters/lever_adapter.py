import httpx
from typing import List, Dict, Any
from .base import BaseJobAdapter

class LeverAdapter(BaseJobAdapter):
    source_name = "lever"

    DEFAULT_COMPANIES = ["netflix", "atlassian", "palantir", "postman"]

    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for company in self.DEFAULT_COMPANIES:
                if len(results) >= limit:
                    break
                url = f"https://api.lever.co/v0/postings/{company}?mode=json"
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        postings = resp.json()
                        for p in postings:
                            title = p.get("text", "")
                            cats = p.get("categories", {})
                            loc = cats.get("location", "Remote")
                            work_type = p.get("workplaceType", "remote")
                            if query and query.lower() not in title.lower():
                                continue
                            results.append({
                                "external_id": f"lev_{p.get('id')}",
                                "company": company.title(),
                                "title": title,
                                "location": loc,
                                "work_arrangement": work_type.lower(),
                                "employment_type": cats.get("commitment", "Full-time"),
                                "url": p.get("hostedUrl"),
                                "application_url": p.get("applyUrl") or p.get("hostedUrl"),
                                "description": p.get("descriptionPlain", f"Role at {company.title()} for {title}"),
                                "posted_at": None
                            })
                            if len(results) >= limit:
                                break
                except Exception:
                    continue
        return results
