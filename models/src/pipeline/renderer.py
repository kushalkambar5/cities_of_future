from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

COLOR_PALETTE = {
    "vehicle": (255, 180, 0),       # Cyan-amber
    "helmet": (0, 200, 0),          # Green
    "no_helmet": (0, 0, 255),       # Red
    "belt": (0, 200, 0),            # Green
    "no_belt": (0, 0, 255),         # Red
    "plate": (255, 255, 0),         # Yellow / Cyan
    "text": (255, 255, 255),        # White
    "danger": (0, 0, 255),          # Red
    "safe": (0, 200, 0),            # Green
}


class AnnotationRenderer:
    """Renders real-time bounding boxes, violation tags, speed labels,
    and accident alerts onto video frames or images.
    """

    def __init__(self, colors: Optional[Dict[str, Tuple[int, int, int]]] = None):
        self.colors = colors or COLOR_PALETTE

    def draw_seatbelt(
        self,
        frame: np.ndarray,
        box: Tuple[int, int, int, int],
        kind: str,
        name: str,
        confidence: float,
    ) -> None:
        color = self.colors.get(kind, self.colors["belt"])
        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), color, 2)
        label = f"{name} {confidence:.2f}"
        cv2.putText(frame, label, (box[0], max(20, box[1] - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.50, color, 2)

    def draw_helmet(
        self,
        frame: np.ndarray,
        box: Tuple[int, int, int, int],
        kind: str,
        name: str,
        confidence: float,
    ) -> None:
        color = self.colors.get(kind, self.colors["helmet"])
        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), color, 2)
        label = f"{name} {confidence:.2f}"
        cv2.putText(frame, label, (box[0], max(20, box[1] - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.50, color, 2)

    def draw_plate(
        self,
        frame: np.ndarray,
        box: Tuple[int, int, int, int],
        plate_text: Optional[str] = None,
    ) -> None:
        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), self.colors["plate"], 2)
        if plate_text:
            cv2.putText(frame, plate_text, (box[0], max(20, box[1] - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.50, self.colors["plate"], 2)

    def draw_accident_banner(
        self,
        frame: np.ndarray,
        accident_active: bool,
        accident_label: str,
        confidence: float,
    ) -> None:
        if accident_active:
            cv2.rectangle(frame, (10, 10), (420, 55), (0, 0, 220), -1)
            cv2.putText(
                frame,
                f"ACCIDENT ALERT: {confidence:.0%}",
                (20, 42),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (255, 255, 255),
                2,
            )
        else:
            cv2.putText(
                frame,
                f"Road Status: {accident_label} ({confidence:.0%})",
                (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                self.colors["safe"],
                2,
            )

    def draw_vehicle_card(
        self,
        frame: np.ndarray,
        box: Tuple[int, int, int, int],
        track_id: int,
        speed_kmh: Optional[float],
        plate: str,
        helmet_kind: str,
        seatbelt_kind: str,
        danger_score: float,
        violations: List[str],
    ) -> None:
        x1, y1, x2, y2 = box
        has_violation = len(violations) > 0
        box_color = self.colors["no_helmet"] if has_violation else self.colors["vehicle"]
        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

        speed_str = f"{speed_kmh:.0f} km/h" if speed_kmh is not None else "N/A"
        header = f"#{track_id} {speed_str} | {plate}"
        cv2.putText(frame, header, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, self.colors["text"], 2)

        h = frame.shape[0]
        meta1 = f"danger: {danger_score}/100 | helm: {helmet_kind} | belt: {seatbelt_kind}"
        cv2.putText(frame, meta1, (x1, min(h - 25, y2 + 18)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 2)

        viol_str = f"violations: {', '.join(violations) if violations else 'none'}"
        cv2.putText(frame, viol_str, (x1, min(h - 10, y2 + 36)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 2)
