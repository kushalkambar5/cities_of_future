import os
import torch
from fastapi import APIRouter
from ...config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """System and hardware health check."""
    cuda_available = torch.cuda.is_available() and not settings.FORCE_CPU
    gpu_name = torch.cuda.get_device_name(0) if cuda_available else None

    models_status = {
        "speed_model": os.path.isfile(settings.SPEED_MODEL_PATH),
        "helmet_model": os.path.isfile(settings.HELMET_MODEL_PATH),
        "seatbelt_model": os.path.isfile(settings.SEATBELT_MODEL_PATH),
        "accident_model": os.path.isfile(settings.ACCIDENT_MODEL_PATH),
    }

    all_models_present = all(models_status.values())

    return {
        "status": "healthy" if all_models_present else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "device": "cuda" if cuda_available else "cpu",
        "gpu_name": gpu_name,
        "models_verified": models_status,
    }


@router.get("/ready")
def readiness_check():
    return {"ready": True}
