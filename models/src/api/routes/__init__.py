from .health import router as health_router
from .detect import router as detect_router
from .pipeline import router as pipeline_router

__all__ = [
    "health_router",
    "detect_router",
    "pipeline_router",
]
