from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseJobAdapter(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Name of the adapter source e.g. 'greenhouse', 'adzuna'"""
        pass

    @abstractmethod
    async def fetch_jobs(self, query: str = "", location: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch raw job listings from the authorized source without violating terms or access controls."""
        pass
