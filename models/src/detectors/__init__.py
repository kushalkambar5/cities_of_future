from .base import BaseDetector
from .vehicle_speed import VehicleSpeedDetector
from .helmet import HelmetDetector
from .seatbelt import SeatbeltDetector
from .plate import PlateDetector
from .accident import AccidentDetector
from .wrong_side import WrongSideDetector

__all__ = [
    "BaseDetector",
    "VehicleSpeedDetector",
    "HelmetDetector",
    "SeatbeltDetector",
    "PlateDetector",
    "AccidentDetector",
    "WrongSideDetector",
]
