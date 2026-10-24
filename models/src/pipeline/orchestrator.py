from collections import defaultdict, deque
import math
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

from ..config import settings
from ..core.danger import (
    TrajPoint,
    VehicleTrajectory,
    assess_dangers,
    driving_score,
)
from ..core.geometry import associate_detection_to_vehicles
from ..detectors.accident import AccidentDetector
from ..detectors.helmet import HelmetDetector
from ..detectors.plate import PlateDetector
from ..detectors.seatbelt import SeatbeltDetector
from ..detectors.vehicle_speed import VehicleSpeedDetector
from ..detectors.wrong_side import WrongSideDetector
from ..schemas.detection import (
    AccidentDetection,
    PipelineProcessResult,
    VehicleReportSummary,
)
from ..schemas.events import DetectionEventItem, DetectionEventType
from .renderer import AnnotationRenderer


class MultiModelPipeline:
    """Orchestrates all computer vision models (Vehicle Tracking, Speed, Helmet,
    Seatbelt, ANPR, Accident, Wrong-side, and Danger Scoring) into a cohesive pipeline.
    """

    def __init__(
        self,
        vehicle_detector: Optional[VehicleSpeedDetector] = None,
        helmet_detector: Optional[HelmetDetector] = None,
        seatbelt_detector: Optional[SeatbeltDetector] = None,
        plate_detector: Optional[PlateDetector] = None,
        accident_detector: Optional[AccidentDetector] = None,
        wrong_side_detector: Optional[WrongSideDetector] = None,
        renderer: Optional[AnnotationRenderer] = None,
    ):
        self.vehicle_detector = vehicle_detector or VehicleSpeedDetector()
        self.helmet_detector = helmet_detector or HelmetDetector()
        self.seatbelt_detector = seatbelt_detector or SeatbeltDetector()
        self.plate_detector = plate_detector or PlateDetector()
        self.accident_detector = accident_detector or AccidentDetector()
        self.wrong_side_detector = wrong_side_detector or WrongSideDetector()
        self.renderer = renderer or AnnotationRenderer()

    def preload_all(self) -> None:
        """Preload all model weights into memory/GPU for fast subsequent inference."""
        self.vehicle_detector.load()
        self.helmet_detector.load()
        self.seatbelt_detector.load()
        self.plate_detector.load()
        self.accident_detector.load()

    def process_image(
        self,
        input_image: np.ndarray,
        output_path: Optional[str] = None,
        camera_id: str = "CAM_DEFAULT",
        simulation_id: Optional[int] = None,
    ) -> PipelineProcessResult:
        """Run full multi-model detection pipeline on a single image."""
        self.preload_all()
        annotated = input_image.copy()
        height, width = input_image.shape[:2]

        # 1. Vehicle Detection
        vehicles = self.vehicle_detector.detect_image(input_image)

        # 2. Sub-detectors
        helmet_detections = self.helmet_detector.predict_frame(input_image)
        seatbelt_detections = self.seatbelt_detector.predict_frame(input_image)
        plate_detections = self.plate_detector.predict_frame(input_image)
        accident_label, accident_conf, accident_probs = self.accident_detector.predict_frame(input_image)
        accident_active = accident_label.lower() == "accident" and accident_conf >= settings.ACCIDENT_CONFIDENCE

        # 3. Associate detections to vehicles
        helmet_cache: Dict[int, Tuple[str, str, float]] = {}
        seatbelt_cache: Dict[int, Tuple[str, str, float]] = {}
        plate_cache: Dict[int, Tuple[str, float, bool]] = {}

        for box, kind, name, conf in seatbelt_detections:
            track_id = associate_detection_to_vehicles(box, vehicles)
            if track_id is not None:
                seatbelt_cache[track_id] = (kind, name, conf)
            if output_path:
                self.renderer.draw_seatbelt(annotated, box, kind, name, conf)

        for box, kind, name, conf in helmet_detections:
            track_id = associate_detection_to_vehicles(box, vehicles, upper_only=True)
            if track_id is not None:
                helmet_cache[track_id] = (kind, name, conf)
            if output_path:
                self.renderer.draw_helmet(annotated, box, kind, name, conf)

        for box, text, conf, is_synth in plate_detections:
            track_id = associate_detection_to_vehicles(box, vehicles)
            if track_id is not None and text:
                plate_cache[track_id] = (text, conf, False)
            if output_path:
                self.renderer.draw_plate(annotated, box, text)

        if output_path:
            self.renderer.draw_accident_banner(annotated, accident_active, accident_label, accident_conf)

        # 4. Consolidate results & events
        vehicle_summaries: List[VehicleReportSummary] = []
        events: List[DetectionEventItem] = []

        if accident_active:
            events.append(DetectionEventItem(
                simulation_id=simulation_id,
                camera_id=camera_id,
                event_type=DetectionEventType.ACCIDENT,
                simulation_time_ms=0,
                confidence=accident_conf,
                data={"status": accident_label, "probabilities": accident_probs},
            ))

        for track_id, box in vehicles.items():
            plate_info = plate_cache.get(track_id)
            if plate_info is not None:
                plate_num, plate_conf, is_gen = plate_info
            else:
                plate_num, plate_conf, is_gen = self.plate_detector.get_plate_for_track(track_id)

            helmet_info = helmet_cache.get(track_id, ("unknown", "unknown", 0.0))
            seatbelt_info = seatbelt_cache.get(track_id, ("unknown", "unknown", 0.0))

            violations: List[str] = []
            if helmet_info[0] == "no_helmet":
                violations.append("no_helmet")
                events.append(DetectionEventItem(
                    simulation_id=simulation_id,
                    camera_id=camera_id,
                    vehicle_track_id=str(track_id),
                    plate_number=plate_num,
                    event_type=DetectionEventType.HELMET,
                    simulation_time_ms=0,
                    confidence=helmet_info[2],
                    data={"helmet_status": "NO_HELMET", "bbox": list(box)},
                ))

            if seatbelt_info[0] == "no_belt":
                violations.append("no_seatbelt")
                events.append(DetectionEventItem(
                    simulation_id=simulation_id,
                    camera_id=camera_id,
                    vehicle_track_id=str(track_id),
                    plate_number=plate_num,
                    event_type=DetectionEventType.SEATBELT,
                    simulation_time_ms=0,
                    confidence=seatbelt_info[2],
                    data={"seatbelt_status": "NO_SEATBELT", "bbox": list(box)},
                ))

            if accident_active:
                violations.append("accident")

            # Emits PLATE event
            events.append(DetectionEventItem(
                simulation_id=simulation_id,
                camera_id=camera_id,
                vehicle_track_id=str(track_id),
                plate_number=plate_num,
                event_type=DetectionEventType.PLATE,
                simulation_time_ms=0,
                confidence=plate_conf if not is_gen else 0.5,
                data={"is_synthetic": is_gen, "bbox": list(box)},
            ))

            score = 100.0 if not violations else max(0.0, 100.0 - (len(violations) * 20.0))

            vehicle_summaries.append(VehicleReportSummary(
                track_id=track_id,
                number_plate=plate_num,
                plate_confidence=plate_conf,
                generated_plate=is_gen,
                speed_kmh=None,
                helmet_status=helmet_info[0],
                seatbelt_status=seatbelt_info[0],
                danger_score=score,
                accident_status=accident_label,
                accident_confidence=round(accident_conf, 3),
                violations=violations,
            ))

            if output_path:
                self.renderer.draw_vehicle_card(
                    annotated,
                    box,
                    track_id,
                    None,
                    plate_num,
                    helmet_info[0],
                    seatbelt_info[0],
                    score,
                    violations,
                )

        if output_path:
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            cv2.imwrite(output_path, annotated)

        return PipelineProcessResult(
            success=True,
            media_type="image",
            total_frames_processed=1,
            duration_seconds=0.0,
            accident_overall=AccidentDetection(
                accident_detected=accident_active,
                status=accident_label,
                confidence=round(accident_conf, 3),
                class_probabilities=accident_probs,
            ),
            vehicles=vehicle_summaries,
            events=events,
            annotated_media_url=output_path,
        )

    def process_video(
        self,
        video_path: str,
        output_path: Optional[str] = None,
        expected_direction_deg: float = 90.0,
        direction_tolerance_deg: float = 90.0,
        speed_limit_kmh: float = 60.0,
        camera_id: str = "CAM_DEFAULT",
        simulation_id: Optional[int] = None,
    ) -> PipelineProcessResult:
        """Run full multi-model detection pipeline on a video file."""
        self.preload_all()

        # Step 1: Vehicle tracking and speed calculation
        (
            frames_vehicles,
            speeds,
            fps,
            width,
            height,
            duration,
            trajectories,
        ) = self.vehicle_detector.track_video(video_path)

        # Step 2: Read video frames into memory/buffer
        cap = cv2.VideoCapture(video_path)
        video_frames: List[np.ndarray] = []
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            video_frames.append(frame)
        cap.release()

        total_frames = len(video_frames)
        if total_frames == 0:
            raise ValueError(f"No frames could be extracted from: {video_path}")

        # Step 3: Batched inference for sub-detectors
        batch_size = settings.BATCH_SIZE
        helmet_preds: List[List[Tuple[Tuple[int, int, int, int], str, str, float]]] = []
        seatbelt_preds: List[List[Tuple[Tuple[int, int, int, int], str, str, float]]] = []
        accident_preds: List[Tuple[str, float, Dict[str, float]]] = []

        for start in range(0, total_frames, batch_size):
            batch = video_frames[start : start + batch_size]
            helmet_preds.extend(self.helmet_detector.predict_batch(batch))
            seatbelt_preds.extend(self.seatbelt_detector.predict_batch(batch))
            accident_preds.extend(self.accident_detector.predict_batch(batch))

        # Setup Video Writer if output is requested
        writer = None
        if output_path:
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        plate_cache: Dict[int, Tuple[str, float, bool]] = {}
        helmet_cache: Dict[int, Tuple[str, str, float]] = {}
        seatbelt_cache: Dict[int, Tuple[str, str, float]] = {}

        danger_states: Dict[int, VehicleTrajectory] = {}
        danger_events: Dict[int, List[Any]] = defaultdict(list)
        max_seen_speeds: Dict[int, float] = defaultdict(float)

        accident_history = deque(maxlen=max(3, int(fps * 1.0)))
        accident_overall_detected = False
        latest_accident_status = "Non Accident"
        latest_accident_conf = 0.0
        latest_accident_probs: Dict[str, float] = {}

        events: List[DetectionEventItem] = []

        for frame_idx, vehicles in enumerate(frames_vehicles):
            frame = video_frames[frame_idx]
            sim_time_ms = int((frame_idx / fps) * 1000)

            # Accident status
            acc_result = accident_preds[frame_idx]
            latest_accident_status = acc_result[0]
            latest_accident_conf = acc_result[1]
            latest_accident_probs = acc_result[2]

            is_acc = latest_accident_status.lower() == "accident"
            accident_history.append(is_acc)
            accident_active = sum(accident_history) >= max(2, int(len(accident_history) * 0.6))
            if accident_active:
                accident_overall_detected = True

            # Process Seatbelt detections for frame
            for box, kind, name, conf in seatbelt_preds[frame_idx]:
                tid = associate_detection_to_vehicles(box, vehicles)
                if tid is not None:
                    seatbelt_cache[tid] = (kind, name, conf)
                if writer:
                    self.renderer.draw_seatbelt(frame, box, kind, name, conf)

            # Process Helmet detections for frame
            for box, kind, name, conf in helmet_preds[frame_idx]:
                tid = associate_detection_to_vehicles(box, vehicles, upper_only=True)
                if tid is not None:
                    helmet_cache[tid] = (kind, name, conf)
                if writer:
                    self.renderer.draw_helmet(frame, box, kind, name, conf)

            # Process ALPR detections for frame
            plates_in_frame = self.plate_detector.predict_frame(frame)
            for box, text, conf, is_synth in plates_in_frame:
                tid = associate_detection_to_vehicles(box, vehicles)
                if tid is not None and text:
                    plate_cache[tid] = (text, conf, False)
                if writer:
                    self.renderer.draw_plate(frame, box, text)

            if writer:
                self.renderer.draw_accident_banner(frame, accident_active, latest_accident_status, latest_accident_conf)

            # Process tracked vehicles in this frame
            for track_id, box in vehicles.items():
                if track_id not in plate_cache:
                    plate_cache[track_id] = self.plate_detector.get_plate_for_track(track_id)
                plate_str, plate_conf, is_gen = plate_cache[track_id]

                helmet = helmet_cache.get(track_id, ("unknown", "unknown", 0.0))
                seatbelt = seatbelt_cache.get(track_id, ("unknown", "unknown", 0.0))
                current_speed = speeds.get(track_id, 0.0)
                max_seen_speeds[track_id] = max(max_seen_speeds[track_id], current_speed)

                violations: List[str] = []
                if current_speed > speed_limit_kmh:
                    violations.append("overspeed")
                    events.append(DetectionEventItem(
                        simulation_id=simulation_id,
                        camera_id=camera_id,
                        vehicle_track_id=str(track_id),
                        plate_number=plate_str,
                        event_type=DetectionEventType.SPEED,
                        simulation_time_ms=sim_time_ms,
                        confidence=0.95,
                        data={"speed_kmh": current_speed, "speed_limit_kmh": speed_limit_kmh},
                    ))

                if helmet[0] == "no_helmet":
                    violations.append("no_helmet")
                    events.append(DetectionEventItem(
                        simulation_id=simulation_id,
                        camera_id=camera_id,
                        vehicle_track_id=str(track_id),
                        plate_number=plate_str,
                        event_type=DetectionEventType.HELMET,
                        simulation_time_ms=sim_time_ms,
                        confidence=helmet[2],
                        data={"status": "NO_HELMET"},
                    ))

                if seatbelt[0] == "no_belt":
                    violations.append("no_seatbelt")
                    events.append(DetectionEventItem(
                        simulation_id=simulation_id,
                        camera_id=camera_id,
                        vehicle_track_id=str(track_id),
                        plate_number=plate_str,
                        event_type=DetectionEventType.SEATBELT,
                        simulation_time_ms=sim_time_ms,
                        confidence=seatbelt[2],
                        data={"status": "NO_SEATBELT"},
                    ))

                # Direction & Trajectory Danger Assessment
                v_traj = danger_states.setdefault(track_id, VehicleTrajectory(track_id, plate_str))
                history = trajectories.get(track_id, [])
                if history:
                    row = history[min(frame_idx, len(history) - 1)]
                    prev = history[min(max(frame_idx - 1, 0), len(history) - 1)]
                    heading = self.wrong_side_detector.calculate_heading(
                        (prev[1], prev[2]), (row[1], row[2])
                    )
                    is_wrong, _, _ = self.wrong_side_detector.check_wrong_side(
                        heading, expected_direction_deg, direction_tolerance_deg
                    )

                    if is_wrong:
                        violations.append("wrong_side")
                        events.append(DetectionEventItem(
                            simulation_id=simulation_id,
                            camera_id=camera_id,
                            vehicle_track_id=str(track_id),
                            plate_number=plate_str,
                            event_type=DetectionEventType.WRONG_SIDE,
                            simulation_time_ms=sim_time_ms,
                            confidence=0.90,
                            data={"heading_deg": round(math.degrees(heading), 1)},
                        ))

                    v_traj.add(TrajPoint(
                        ts=frame_idx / fps,
                        pos=(row[1], row[2]),
                        speed=current_speed / 3.6,
                        heading=heading,
                        lane_id=0,
                        wrong_side=is_wrong,
                    ))

                    dangers = assess_dangers(v_traj)
                    danger_events[track_id].extend(dangers)

                for d in danger_events[track_id]:
                    if d.vtype not in violations:
                        violations.append(d.vtype)

                if accident_active and "accident" not in violations:
                    violations.append("accident")

                score = driving_score(danger_events[track_id], max_seen_speeds[track_id], speed_limit_kmh)

                if writer:
                    self.renderer.draw_vehicle_card(
                        frame,
                        box,
                        track_id,
                        current_speed,
                        plate_str,
                        helmet[0],
                        seatbelt[0],
                        score,
                        violations,
                    )

            if writer:
                writer.write(frame)

        if writer:
            writer.release()

        # Build final report summaries
        final_vehicles: List[VehicleReportSummary] = []
        for track_id, (plate_str, plate_conf, is_gen) in plate_cache.items():
            helmet = helmet_cache.get(track_id, ("unknown", "unknown", 0.0))
            seatbelt = seatbelt_cache.get(track_id, ("unknown", "unknown", 0.0))
            speed = speeds.get(track_id, 0.0)

            v_list: List[str] = []
            if speed > speed_limit_kmh:
                v_list.append("overspeed")
            if helmet[0] == "no_helmet":
                v_list.append("no_helmet")
            if seatbelt[0] == "no_belt":
                v_list.append("no_seatbelt")
            for d in danger_events[track_id]:
                if d.vtype not in v_list:
                    v_list.append(d.vtype)
            if accident_overall_detected and "accident" not in v_list:
                v_list.append("accident")

            score = driving_score(danger_events[track_id], max_seen_speeds[track_id], speed_limit_kmh)

            final_vehicles.append(VehicleReportSummary(
                track_id=track_id,
                number_plate=plate_str,
                plate_confidence=round(plate_conf, 3),
                generated_plate=is_gen,
                speed_kmh=round(speed, 2),
                helmet_status=helmet[0],
                seatbelt_status=seatbelt[0],
                danger_score=score,
                accident_status="Accident" if accident_overall_detected else latest_accident_status,
                accident_confidence=round(latest_accident_conf, 3),
                violations=v_list,
            ))

        return PipelineProcessResult(
            success=True,
            media_type="video",
            total_frames_processed=total_frames,
            duration_seconds=round(duration, 2),
            accident_overall=AccidentDetection(
                accident_detected=accident_overall_detected,
                status="Accident" if accident_overall_detected else latest_accident_status,
                confidence=round(latest_accident_conf, 3),
                class_probabilities=latest_accident_probs,
            ),
            vehicles=final_vehicles,
            events=events,
            annotated_media_url=output_path,
        )
