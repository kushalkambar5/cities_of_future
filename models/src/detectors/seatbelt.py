from pathlib import Path
from typing import Any, List, Optional, Set, Tuple
import numpy as np
from ultralytics import YOLO

from ..config import settings
from .base import BaseDetector

SeatbeltDetectionTuple = Tuple[Tuple[int, int, int, int], str, str, float]  # (box, kind, raw_name, confidence)
IGNORE_CLASSES: Set[str] = {"1", "2", "person", "windshield"}


class SeatbeltDetector(BaseDetector):
    """Detects seatbelt compliance using fine-tuned YOLO model."""

    def __init__(self, model_path: Optional[str] = None, conf_threshold: Optional[float] = None):
        self.model_path = model_path or settings.SEATBELT_MODEL_PATH
        self.conf = conf_threshold if conf_threshold is not None else settings.SEATBELT_CONFIDENCE
        self.model: Optional[YOLO] = None

    def load(self) -> None:
        if self.model is None:
            if not Path(self.model_path).is_file():
                raise FileNotFoundError(f"Seatbelt model weights not found at: {self.model_path}")
            self.model = YOLO(self.model_path)

    def is_loaded(self) -> bool:
        return self.model is not None

    @staticmethod
    def classify_kind(name: str) -> Optional[str]:
        """Classify detector label into 'belt' or 'no_belt'. Returns None if ignored class."""
        if name.lower() in IGNORE_CLASSES:
            return None
        normalized = name.lower().replace(" ", "").replace("-", "").replace("_", "")
        if (
            normalized.startswith(("no", "non", "not", "without"))
            or any(k in normalized for k in ("noseat", "nobelt", "without"))
        ):
            return "no_belt"
        return "belt"

    def predict_frame(self, frame: np.ndarray) -> List[SeatbeltDetectionTuple]:
        self.load()
        assert self.model is not None

        result = self.model.predict(frame, conf=self.conf, imgsz=640, verbose=False)[0]
        return self._parse_result(result)

    def predict_batch(self, frames: List[np.ndarray]) -> List[List[SeatbeltDetectionTuple]]:
        if not frames:
            return []
        self.load()
        assert self.model is not None

        results = self.model.predict(frames, conf=self.conf, imgsz=640, verbose=False)
        return [self._parse_result(r) for r in results]

    def _parse_result(self, result: Any) -> List[SeatbeltDetectionTuple]:
        rows: List[SeatbeltDetectionTuple] = []
        if result.boxes is None or len(result.boxes) == 0:
            return rows

        boxes = result.boxes.xyxy.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy().astype(int)
        confidences = result.boxes.conf.cpu().numpy()

        for box, cls, conf in zip(boxes, classes, confidences):
            name = str(self.model.names[int(cls)])
            kind = self.classify_kind(name)
            if kind is None:
                continue
            rows.append((tuple(map(int, box)), kind, name, float(conf)))

        return rows

    def predict(self, frame: np.ndarray) -> List[SeatbeltDetectionTuple]:
        return self.predict_frame(frame)
