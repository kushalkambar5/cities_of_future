import os
import tempfile
from typing import List, Optional
import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ...config import settings
from ...core.utils import (
    cleanup_path,
    decode_image_bytes,
    is_image_file,
    is_video_file,
)
from ...detectors.accident import AccidentDetector
from ...detectors.helmet import HelmetDetector
from ...detectors.plate import PlateDetector
from ...detectors.seatbelt import SeatbeltDetector
from ...detectors.vehicle_speed import VehicleSpeedDetector
from ...detectors.wrong_side import WrongSideDetector
from ...schemas.detection import (
    AccidentDetection,
    BoundingBoxModel,
    HelmetDetection,
    PlateDetection,
    SeatbeltDetection,
    SingleDetectionResponse,
    SpeedDetection,
    WrongSideDetection,
)
from ..dependencies import (
    get_accident_detector,
    get_helmet_detector,
    get_plate_detector,
    get_seatbelt_detector,
    get_vehicle_detector,
    get_wrong_side_detector,
)

router = APIRouter(prefix="/detect", tags=["Individual Detectors"])


@router.post("/helmet", response_model=SingleDetectionResponse)
async def detect_helmet(
    file: UploadFile = File(...),
    detector: HelmetDetector = Depends(get_helmet_detector),
):
    """Detect helmet and no-helmet violations on an uploaded image."""
    if not is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only image files are supported (.jpg, .png, etc.)")

    contents = await file.read()
    frame = decode_image_bytes(contents)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    results = detector.predict_frame(frame)
    detections = []
    for box, kind, name, conf in results:
        detections.append(
            HelmetDetection(
                bbox=BoundingBoxModel(x1=box[0], y1=box[1], x2=box[2], y2=box[3]),
                label=name,
                kind=kind,
                confidence=round(conf, 3),
            ).model_dump()
        )

    return SingleDetectionResponse(detections=detections)


@router.post("/seatbelt", response_model=SingleDetectionResponse)
async def detect_seatbelt(
    file: UploadFile = File(...),
    detector: SeatbeltDetector = Depends(get_seatbelt_detector),
):
    """Detect seatbelt and no-seatbelt violations on an uploaded image."""
    if not is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only image files are supported (.jpg, .png, etc.)")

    contents = await file.read()
    frame = decode_image_bytes(contents)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    results = detector.predict_frame(frame)
    detections = []
    for box, kind, name, conf in results:
        detections.append(
            SeatbeltDetection(
                bbox=BoundingBoxModel(x1=box[0], y1=box[1], x2=box[2], y2=box[3]),
                label=name,
                kind=kind,
                confidence=round(conf, 3),
            ).model_dump()
        )

    return SingleDetectionResponse(detections=detections)


@router.post("/plate", response_model=SingleDetectionResponse)
async def detect_plate(
    file: UploadFile = File(...),
    detector: PlateDetector = Depends(get_plate_detector),
):
    """Detect license plates and perform OCR on an uploaded image."""
    if not is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only image files are supported (.jpg, .png, etc.)")

    contents = await file.read()
    frame = decode_image_bytes(contents)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    results = detector.predict_frame(frame)
    detections = []
    for box, text, conf, is_synth in results:
        detections.append(
            PlateDetection(
                bbox=BoundingBoxModel(x1=box[0], y1=box[1], x2=box[2], y2=box[3]),
                plate_number=text,
                confidence=round(conf, 3),
                is_synthetic=is_synth,
            ).model_dump()
        )

    return SingleDetectionResponse(detections=detections)


@router.post("/accident", response_model=AccidentDetection)
async def detect_accident(
    file: UploadFile = File(...),
    detector: AccidentDetector = Depends(get_accident_detector),
):
    """Classify an image as Accident or Non Accident."""
    if not is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only image files are supported (.jpg, .png, etc.)")

    contents = await file.read()
    frame = decode_image_bytes(contents)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    status, conf, probs = detector.predict_frame(frame)
    is_accident = status.lower() == "accident" and conf >= settings.ACCIDENT_CONFIDENCE

    return AccidentDetection(
        accident_detected=is_accident,
        status=status,
        confidence=round(conf, 3),
        class_probabilities=probs,
    )


@router.post("/speed", response_model=SingleDetectionResponse)
async def detect_speed(
    file: UploadFile = File(...),
    speed_limit_kmh: float = Form(60.0),
    detector: VehicleSpeedDetector = Depends(get_vehicle_detector),
):
    """Estimate vehicle speeds from a video clip using ByteTrack + Perspective Transform."""
    if not is_video_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only video files are supported (.mp4, .avi, etc.)")

    tmp_dir = tempfile.mkdtemp(prefix="cotf_speed_")
    tmp_path = os.path.join(tmp_dir, file.filename or "video.mp4")

    try:
        with open(tmp_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        _, speeds, _, _, _, _, _ = detector.track_video(tmp_path)
        detections = []
        for tid, spd in speeds.items():
            detections.append(
                SpeedDetection(
                    track_id=tid,
                    speed_kmh=spd,
                    is_overspeed=spd > speed_limit_kmh,
                    speed_limit_kmh=speed_limit_kmh,
                ).model_dump()
            )

        return SingleDetectionResponse(detections=detections)
    finally:
        cleanup_path(tmp_dir)


@router.post("/wrong-side", response_model=WrongSideDetection)
async def detect_wrong_side(
    track_id: int = Form(1),
    prev_x: float = Form(...),
    prev_y: float = Form(...),
    curr_x: float = Form(...),
    curr_y: float = Form(...),
    expected_direction_deg: float = Form(90.0),
    tolerance_deg: float = Form(90.0),
    detector: WrongSideDetector = Depends(get_wrong_side_detector),
):
    """Check if trajectory movement violates the designated road direction."""
    heading_rad = detector.calculate_heading((prev_x, prev_y), (curr_x, curr_y))
    is_wrong, heading_deg, delta_deg = detector.check_wrong_side(
        heading_rad, expected_direction_deg, tolerance_deg
    )

    return WrongSideDetection(
        track_id=track_id,
        is_wrong_side=is_wrong,
        current_heading_deg=round(heading_deg, 1),
        expected_heading_deg=expected_direction_deg,
        heading_diff_deg=delta_deg,
    )
