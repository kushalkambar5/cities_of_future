import logging
from typing import List, Optional, Tuple
import numpy as np

from ..core.utils import generate_synthetic_plate
from .base import BaseDetector

logger = logging.getLogger(__name__)

PlateDetectionTuple = Tuple[Tuple[int, int, int, int], str, float, bool]  # (box, text, confidence, is_synthetic)


class PlateDetector(BaseDetector):
    """Automatic Number Plate Recognition (ANPR) detector.
    Uses FastALPR if available, with robust fallback mechanisms.
    """

    def __init__(self):
        self.alpr = None
        self._alpr_available = False

    def load(self) -> None:
        if self.alpr is None:
            try:
                from fast_alpr import ALPR
                self.alpr = ALPR()
                self._alpr_available = True
                logger.info("FastALPR engine loaded successfully.")
            except Exception as exc:
                logger.warning(f"FastALPR engine could not be initialized ({exc}). Fallback generator enabled.")
                self.alpr = False
                self._alpr_available = False

    def is_loaded(self) -> bool:
        return self.alpr is not None

    def predict_frame(self, frame: np.ndarray) -> List[PlateDetectionTuple]:
        """Detect license plates and OCR characters in an image frame."""
        self.load()
        rows: List[PlateDetectionTuple] = []

        if self._alpr_available and self.alpr:
            try:
                for result in self.alpr.predict(frame):
                    box = result.detection.bounding_box
                    x1, y1, x2, y2 = int(box.x1), int(box.y1), int(box.x2), int(box.y2)
                    text = ""
                    confidence = 0.0

                    if result.ocr is not None:
                        text = str(result.ocr.text or "").strip().upper()
                        val = result.ocr.confidence
                        confidence = float(np.mean(val)) if isinstance(val, (list, tuple, np.ndarray)) else float(val)

                    rows.append(((x1, y1, x2, y2), text, confidence, False))
                return rows
            except Exception as e:
                logger.error(f"Error during FastALPR prediction: {e}")

        return rows

    def get_plate_for_track(
        self,
        track_id: int,
        detected_text: Optional[str] = None,
        detected_conf: float = 0.0,
    ) -> Tuple[str, float, bool]:
        """Returns detected plate if valid, else returns realistic synthetic plate for the track."""
        if detected_text and len(detected_text) >= 4:
            return detected_text, detected_conf, False
        return generate_synthetic_plate(track_id), 0.0, True

    def predict(self, frame: np.ndarray) -> List[PlateDetectionTuple]:
        return self.predict_frame(frame)
