from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
from ultralytics import YOLO

from ..config import settings
from ..core.perspective import PerspectiveTransformer
from .base import BaseDetector


class VehicleSpeedDetector(BaseDetector):
    """Detects vehicles using YOLOv8n, tracks trajectories via ByteTrack,
    and estimates real-world road speeds (km/h) via perspective transformation.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        conf_threshold: Optional[float] = None,
        tracker_config: Optional[str] = None,
        transformer: Optional[PerspectiveTransformer] = None,
    ):
        self.model_path = model_path or settings.SPEED_MODEL_PATH
        self.conf = conf_threshold if conf_threshold is not None else settings.DEFAULT_CONFIDENCE
        self.tracker = tracker_config or settings.TRACKER_CONFIG
        self.classes = settings.VEHICLE_CLASSES
        self.transformer = transformer or PerspectiveTransformer(
            source_points=settings.DEFAULT_SOURCE_POINTS,
            road_width_m=settings.ROAD_WIDTH_METERS,
            road_length_m=settings.ROAD_LENGTH_METERS,
        )
        self.model: Optional[YOLO] = None

    def load(self) -> None:
        if self.model is None:
            if not Path(self.model_path).is_file():
                raise FileNotFoundError(f"Vehicle/Speed model weights not found at: {self.model_path}")
            self.model = YOLO(self.model_path)

    def is_loaded(self) -> bool:
        return self.model is not None

    def detect_image(self, frame: np.ndarray) -> Dict[int, Tuple[int, int, int, int]]:
        """Run single-image vehicle detection without temporal tracking.
        Returns mapping of pseudo track_id (1..N) -> (x1, y1, x2, y2).
        """
        self.load()
        assert self.model is not None
        results = self.model.predict(
            frame,
            classes=self.classes,
            conf=self.conf,
            verbose=False,
        )[0]

        vehicles: Dict[int, Tuple[int, int, int, int]] = {}
        if results.boxes is not None and len(results.boxes) > 0:
            boxes = results.boxes.xyxy.cpu().numpy()
            for idx, box in enumerate(boxes, start=1):
                vehicles[idx] = tuple(map(int, box))
        return vehicles

    def track_video(
        self,
        video_path: str,
        min_samples: int = 5,
    ) -> Tuple[List[Dict[int, Tuple[int, int, int, int]]], Dict[int, float], float, int, int, float, Dict[int, List[Tuple[int, float, float]]]]:
        """Process video through ByteTrack and calculate per-vehicle speeds.
        
        Returns:
            per_frame_vehicles: List of frame-by-frame {track_id: (x1, y1, x2, y2)}
            speeds: Dict {track_id: speed_kmh}
            fps: Video frames per second
            width: Frame width
            height: Frame height
            duration: Video duration in seconds
            trajectories: Dict {track_id: [(frame_idx, world_x, world_y)]}
        """
        self.load()
        assert self.model is not None

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0.0

        trajectories: Dict[int, List[Tuple[int, float, float]]] = defaultdict(list)
        per_frame_vehicles: List[Dict[int, Tuple[int, int, int, int]]] = []
        frame_index = 0

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            result = self.model.track(
                frame,
                persist=True,
                tracker=self.tracker,
                classes=self.classes,
                conf=self.conf,
                verbose=False,
            )[0]

            vehicles: Dict[int, Tuple[int, int, int, int]] = {}
            if result.boxes is not None and result.boxes.id is not None:
                boxes = result.boxes.xyxy.cpu().numpy()
                ids = result.boxes.id.cpu().numpy().astype(int)
                for box, track_id in zip(boxes, ids):
                    box_tuple = tuple(map(int, box))
                    tid = int(track_id)
                    vehicles[tid] = box_tuple

                    # Bottom-center anchor point in image pixels
                    anchor_x = (box_tuple[0] + box_tuple[2]) / 2.0
                    anchor_y = float(box_tuple[3])
                    world_x, world_y = self.transformer.transform_point(anchor_x, anchor_y)
                    trajectories[tid].append((frame_index, world_x, world_y))

            per_frame_vehicles.append(vehicles)
            frame_index += 1

        cap.release()

        # Calculate estimated speeds
        speeds: Dict[int, float] = {}
        for track_id, samples in trajectories.items():
            if len(samples) < min_samples:
                continue
            first, last = np.array(samples[0]), np.array(samples[-1])
            elapsed = (last[0] - first[0]) / fps
            if elapsed > 0:
                distance = float(np.linalg.norm(last[1:] - first[1:]))
                # Convert m/s -> km/h, apply calibration scale & offset
                speed = (distance / elapsed) * 3.6 * settings.SPEED_SCALE + settings.SPEED_OFFSET
                speeds[track_id] = round(speed, 2)

        return per_frame_vehicles, speeds, fps, width, height, duration, trajectories

    def predict(self, frame: np.ndarray) -> Dict[int, Tuple[int, int, int, int]]:
        return self.detect_image(frame)
