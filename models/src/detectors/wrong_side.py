import math
from typing import Tuple
from .base import BaseDetector


class WrongSideDetector(BaseDetector):
    """Detects wrong-side or counter-flow driving by comparing trajectory heading
    against expected traffic direction and angular tolerance.
    """

    def __init__(
        self,
        expected_direction_deg: float = 90.0,
        direction_tolerance_deg: float = 90.0,
    ):
        self.expected_direction_deg = expected_direction_deg
        self.direction_tolerance_deg = direction_tolerance_deg

    def load(self) -> None:
        pass

    def is_loaded(self) -> bool:
        return True

    def calculate_heading(
        self,
        prev_pos: Tuple[float, float],
        curr_pos: Tuple[float, float],
    ) -> float:
        """Calculate movement heading in radians from world coordinates."""
        dx = curr_pos[0] - prev_pos[0]
        dy = curr_pos[1] - prev_pos[1]
        if abs(dx) < 1e-4 and abs(dy) < 1e-4:
            return 0.0
        return math.atan2(dy, dx)

    def check_wrong_side(
        self,
        heading_rad: float,
        expected_deg: float,
        tolerance_deg: float,
    ) -> Tuple[bool, float, float]:
        """Determine if heading violates the expected traffic direction.
        
        Returns:
            is_wrong_side: bool
            heading_deg: float
            delta_deg: float (angular difference from expected direction)
        """
        expected_rad = math.radians(expected_deg)
        delta_rad = abs((heading_rad - expected_rad + math.pi) % (2 * math.pi) - math.pi)
        delta_deg = math.degrees(delta_rad)
        is_wrong = delta_deg > tolerance_deg
        return is_wrong, math.degrees(heading_rad), round(delta_deg, 2)

    def predict(
        self,
        prev_pos: Tuple[float, float],
        curr_pos: Tuple[float, float],
        expected_deg: float = 90.0,
        tolerance_deg: float = 90.0,
    ) -> Tuple[bool, float, float]:
        heading = self.calculate_heading(prev_pos, curr_pos)
        return self.check_wrong_side(heading, expected_deg, tolerance_deg)
