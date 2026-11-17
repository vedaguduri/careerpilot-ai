from .base import BaseJobAdapter
from .greenhouse_adapter import GreenhouseAdapter
from .lever_adapter import LeverAdapter
from .ashby_adapter import AshbyAdapter
from .adzuna_adapter import AdzunaAdapter, ManualImportAdapter

ADAPTERS = [
    GreenhouseAdapter(),
    LeverAdapter(),
    AshbyAdapter(),
    AdzunaAdapter(),
    ManualImportAdapter()
]

__all__ = [
    "BaseJobAdapter",
    "GreenhouseAdapter",
    "LeverAdapter",
    "AshbyAdapter",
    "AdzunaAdapter",
    "ManualImportAdapter",
    "ADAPTERS"
]
