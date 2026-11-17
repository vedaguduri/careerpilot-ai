from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def test_connection(self, api_key: str, base_url: Optional[str] = None) -> Dict[str, Any]:
        """Test API connection and credentials validity."""
        pass

    @abstractmethod
    async def list_models(self, api_key: str, base_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """Dynamically discover models available on this provider account."""
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, model: str, api_key: str, base_url: Optional[str] = None) -> str:
        """Generate text response."""
        pass
