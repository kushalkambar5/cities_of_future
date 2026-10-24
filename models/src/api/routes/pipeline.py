import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional
import cv2
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ...config import settings
from ...core.utils import cleanup_path, is_image_file, is_video_file
from ...pipeline.orchestrator import MultiModelPipeline
from ...schemas.detection import PipelineProcessResult
from ..dependencies import get_pipeline

router = APIRouter(prefix="/pipeline", tags=["Integrated Multi-Model Pipeline"])


@router.post("/process", response_model=PipelineProcessResult)
async def process_media(
    file: UploadFile = File(...),
    camera_id: str = Form("CAM_01"),
    simulation_id: Optional[int] = Form(None),
    speed_limit_kmh: float = Form(60.0),
    expected_direction_deg: float = Form(90.0),
    direction_tolerance_deg: float = Form(90.0),
    return_annotated_file: bool = Form(False),
    pipeline: MultiModelPipeline = Depends(get_pipeline),
):
    """Integrated multi-model pipeline: Vehicle tracking, Speed estimation,
    Helmet detection, Seatbelt compliance, Plate ANPR, Accident recognition,
    and Driving Danger scoring.
    
    If `return_annotated_file` is True, returns the annotated video or image directly.
    Otherwise, returns structured JSON detections matching backend schemas.
    """
    filename = file.filename or "input.mp4"
    suffix = Path(filename).suffix.lower()

    if not (is_image_file(filename) or is_video_file(filename)):
        raise HTTPException(
            status_code=400,
            detail="Supported formats: MP4, AVI, MOV, MKV, JPG, JPEG, PNG, WEBP",
        )

    tmp_dir = tempfile.mkdtemp(prefix="cotf_pipeline_")
    input_path = os.path.join(tmp_dir, "input" + suffix)
    is_image = is_image_file(filename)
    output_path = os.path.join(tmp_dir, "annotated.jpg" if is_image else "annotated.mp4")

    try:
        # Save uploaded stream to temporary disk storage
        total_size = 0
        with open(input_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds maximum upload size")
                f.write(chunk)
        await file.close()

        if is_image:
            image_mat = cv2.imread(input_path)
            if image_mat is None:
                raise HTTPException(status_code=400, detail="Could not read uploaded image")

            result = pipeline.process_image(
                input_image=image_mat,
                output_path=output_path if return_annotated_file else None,
                camera_id=camera_id,
                simulation_id=simulation_id,
            )
        else:
            result = pipeline.process_video(
                video_path=input_path,
                output_path=output_path if return_annotated_file else None,
                expected_direction_deg=expected_direction_deg,
                direction_tolerance_deg=direction_tolerance_deg,
                speed_limit_kmh=speed_limit_kmh,
                camera_id=camera_id,
                simulation_id=simulation_id,
            )

        if return_annotated_file:
            media_type = "image/jpeg" if is_image else "video/mp4"
            filename_dl = "annotated.jpg" if is_image else "annotated.mp4"
            return FileResponse(
                output_path,
                media_type=media_type,
                filename=filename_dl,
                background=BackgroundTask(cleanup_path, tmp_dir),
            )

        # Clean up temporary files on JSON return
        cleanup_path(tmp_dir)
        return result

    except HTTPException:
        cleanup_path(tmp_dir)
        raise
    except Exception as exc:
        cleanup_path(tmp_dir)
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {exc}") from exc
