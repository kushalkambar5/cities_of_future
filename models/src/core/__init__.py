"""Core computational utilities for computer vision and traffic analytics.
"""
from .geometry import (
    center_of_box,
    intersection_over_union,
    point_inside_box,
    associate_detection_to_vehicles,
)
from .perspective import PerspectiveTransformer
from .danger import (
    TrajPoint,
    Violation,
    VehicleTrajectory,
    assess_dangers,
    driving_score,
    session_score,
)
from .utils import (
    generate_synthetic_plate,
    get_file_extension,
    is_video_file,
    is_image_file,
    create_temp_dir,
    cleanup_path,
)

__all__ = [
    "center_of_box",
    "intersection_over_union",
    "point_inside_box",
    "associate_detection_to_vehicles",
    "PerspectiveTransformer",
    "TrajPoint",
    "Violation",
    "VehicleTrajectory",
    "assess_dangers",
    "driving_score",
    "session_score",
    "generate_synthetic_plate",
    "get_file_extension",
    "is_video_file",
    "is_image_file",
    "create_temp_dir",
    "cleanup_path",
]
