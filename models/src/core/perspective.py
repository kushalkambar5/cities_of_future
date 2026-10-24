from typing import List, Optional, Tuple
import cv2
import numpy as np


class PerspectiveTransformer:
    """Warps camera image pixel coordinates into metric ground-plane coordinates.
    
    Used to calculate realistic real-world distance (meters) and speed (km/h)
    independent of camera perspective foreshortening.
    """

    def __init__(
        self,
        source_points: Optional[List[Tuple[float, float]]] = None,
        road_width_m: float = 3.6,
        road_length_m: float = 18.0,
    ):
        self.road_width_m = road_width_m
        self.road_length_m = road_length_m

        if source_points is None:
            # Default camera viewpoint points
            source_points = [
                (1252.0, 787.0),
                (2298.0, 803.0),
                (5039.0, 2159.0),
                (-550.0, 2159.0),
            ]

        self.source = np.array(source_points, dtype=np.float32)
        self.target = np.array([
            [0.0, 0.0],
            [road_width_m, 0.0],
            [road_width_m, road_length_m],
            [0.0, road_length_m],
        ], dtype=np.float32)

        self.matrix = cv2.getPerspectiveTransform(self.source, self.target)

    def transform_point(self, x: float, y: float) -> Tuple[float, float]:
        """Convert a single pixel coordinate (x, y) to metric ground coordinate (X, Y)."""
        pts = np.array([[[x, y]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(pts, self.matrix)
        world_x, world_y = transformed[0, 0]
        return float(world_x), float(world_y)

    def transform_points(self, points: np.ndarray) -> np.ndarray:
        """Convert an Nx2 array of image pixel points to Nx2 metric ground points."""
        if points.size == 0:
            return points
        pts = points.reshape(-1, 1, 2).astype(np.float32)
        transformed = cv2.perspectiveTransform(pts, self.matrix)
        return transformed.reshape(-1, 2)
