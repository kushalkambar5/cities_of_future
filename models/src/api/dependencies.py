from functools import lru_cache
from typing import Generator
from ..detectors.vehicle_speed import VehicleSpeedDetector
from ..detectors.helmet import HelmetDetector
from ..detectors.seatbelt import SeatbeltDetector
from ..detectors.plate import PlateDetector
from ..detectors.accident import AccidentDetector
from ..detectors.wrong_side import WrongSideDetector
from ..pipeline.orchestrator import MultiModelPipeline

# Singleton instances
_pipeline_instance: MultiModelPipeline = None


def get_pipeline() -> MultiModelPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = MultiModelPipeline()
    return _pipeline_instance


def get_vehicle_detector() -> VehicleSpeedDetector:
    return get_pipeline().vehicle_detector


def get_helmet_detector() -> HelmetDetector:
    return get_pipeline().helmet_detector


def get_seatbelt_detector() -> SeatbeltDetector:
    return get_pipeline().seatbelt_detector


def get_plate_detector() -> PlateDetector:
    return get_pipeline().plate_detector


def get_accident_detector() -> AccidentDetector:
    return get_pipeline().accident_detector


def get_wrong_side_detector() -> WrongSideDetector:
    return get_pipeline().wrong_side_detector
