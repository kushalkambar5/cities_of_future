from abc import ABC, abstractmethod
from typing import Any


class BaseDetector(ABC):
    """Abstract Base Class for all ML detectors."""

    @abstractmethod
    def load(self) -> None:
        """Load model weights and initialize architecture."""
        pass

    @abstractmethod
    def predict(self, *args: Any, **kwargs: Any) -> Any:
        """Execute inference."""
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if detector is ready for inference."""
        pass
