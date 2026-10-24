import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Optional

import cv2
from fastapi import APIRouter, Body, Depends, HTTPException, Request

from ...config import settings
from ...core.r2 import clean_r2_key, download_file_from_r2, upload_file_to_r2
from ...core.utils import cleanup_path, is_image_file, is_video_file
from ...pipeline.orchestrator import MultiModelPipeline
from ...schemas.detection import PipelineProcessR2Request, PipelineProcessResult
from ..dependencies import get_pipeline

logger = logging.getLogger("cotf.ml.pipeline")

router = APIRouter(prefix="/pipeline", tags=["Integrated Multi-Model Pipeline"])


@router.post(
    "/process",
    response_model=PipelineProcessResult,
    summary="Process traffic media from Cloudflare R2 and upload annotated result to R2",
)
async def process_media(
    request: Request,
    payload: Optional[PipelineProcessR2Request] = Body(None),
    pipeline: MultiModelPipeline = Depends(get_pipeline),
):
    """Integrated multi-model pipeline:
    1. Receives Cloudflare R2 video file key ID.
    2. Downloads input video from Cloudflare R2 into temporary storage.
    3. Runs multi-model inference (tracking, speed, helmet, seatbelt, plate, accident, wrong-way).
    4. Uploads annotated output video directly back to Cloudflare R2.
    5. Cleans up all local temporary files immediately (no permanent local disk storage).
    6. Returns structured JSON containing R2 output video key, timestamps of detected items,
       and complete per-vehicle detection summaries.
    """
    # Extract request parameters
    r2_key: Optional[str] = None
    camera_id: str = "CAM_01"
    simulation_id: Optional[int] = None
    speed_limit_kmh: float = settings.SPEED_LIMIT_KMH
    expected_direction_deg: float = settings.DEFAULT_EXPECTED_DIRECTION_DEG
    direction_tolerance_deg: float = settings.DEFAULT_DIRECTION_TOLERANCE_DEG
    output_r2_prefix: str = "processed"

    if payload is not None and payload.r2_video_key:
        r2_key = payload.r2_video_key
        camera_id = payload.camera_id
        simulation_id = payload.simulation_id
        speed_limit_kmh = payload.speed_limit_kmh
        expected_direction_deg = payload.expected_direction_deg
        direction_tolerance_deg = payload.direction_tolerance_deg
        output_r2_prefix = payload.output_r2_prefix
    else:
        # Check form data or direct JSON if payload was not parsed by FastAPI
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                data = await request.json()
                r2_key = data.get("r2_video_key") or data.get("video_key") or data.get("key")
                camera_id = data.get("camera_id", camera_id)
                simulation_id = data.get("simulation_id", simulation_id)
                speed_limit_kmh = float(data.get("speed_limit_kmh", speed_limit_kmh))
                expected_direction_deg = float(data.get("expected_direction_deg", expected_direction_deg))
                direction_tolerance_deg = float(data.get("direction_tolerance_deg", direction_tolerance_deg))
                output_r2_prefix = data.get("output_r2_prefix", output_r2_prefix)
            except Exception:
                pass
        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            r2_key = form.get("r2_video_key") or form.get("video_key") or form.get("key")
            camera_id = str(form.get("camera_id", camera_id))
            sim_id = form.get("simulation_id")
            if sim_id:
                try:
                    simulation_id = int(sim_id)
                except ValueError:
                    pass
            if "speed_limit_kmh" in form:
                speed_limit_kmh = float(form["speed_limit_kmh"])
            if "expected_direction_deg" in form:
                expected_direction_deg = float(form["expected_direction_deg"])
            if "direction_tolerance_deg" in form:
                direction_tolerance_deg = float(form["direction_tolerance_deg"])
            if "output_r2_prefix" in form:
                output_r2_prefix = str(form["output_r2_prefix"])

    if not r2_key:
        raise HTTPException(
            status_code=400,
            detail="Missing required parameter 'r2_video_key'. Provide the Cloudflare R2 file key ID.",
        )

    clean_key = clean_r2_key(r2_key)
    filename = Path(clean_key).name or "input.mp4"
    suffix = Path(filename).suffix.lower()

    if not suffix:
        suffix = ".mp4"
        filename += suffix

    is_image = is_image_file(filename)
    is_video = is_video_file(filename)

    if not (is_image or is_video):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Supported formats: MP4, AVI, MOV, MKV, JPG, JPEG, PNG, WEBP",
        )

    tmp_dir = tempfile.mkdtemp(prefix="cotf_pipeline_")
    input_path = os.path.join(tmp_dir, f"input_{uuid.uuid4().hex[:6]}{suffix}")
    annotated_filename = f"{Path(filename).stem}_annotated_{uuid.uuid4().hex[:8]}{suffix}"
    output_path = os.path.join(tmp_dir, annotated_filename)

    try:
        # 1. Download file from Cloudflare R2
        try:
            download_file_from_r2(clean_key, input_path)
        except Exception as dl_err:
            raise HTTPException(
                status_code=404,
                detail=f"Failed to download media from Cloudflare R2 for key '{clean_key}': {dl_err}",
            ) from dl_err

        # 2. Run multi-model pipeline inference
        if is_image:
            image_mat = cv2.imread(input_path)
            if image_mat is None:
                raise HTTPException(status_code=400, detail="Could not decode downloaded image")

            result = pipeline.process_image(
                input_image=image_mat,
                output_path=output_path,
                camera_id=camera_id,
                simulation_id=simulation_id,
            )
        else:
            result = pipeline.process_video(
                video_path=input_path,
                output_path=output_path,
                expected_direction_deg=expected_direction_deg,
                direction_tolerance_deg=direction_tolerance_deg,
                speed_limit_kmh=speed_limit_kmh,
                camera_id=camera_id,
                simulation_id=simulation_id,
            )

        # 3. Upload annotated output to Cloudflare R2
        output_dest_key = f"{output_r2_prefix.strip('/')}/{annotated_filename}".lstrip("/")
        content_type = "image/jpeg" if is_image else "video/mp4"

        try:
            output_public_url = upload_file_to_r2(output_path, output_dest_key, content_type=content_type)
        except Exception as up_err:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload processed media to Cloudflare R2: {up_err}",
            ) from up_err

        # 4. Attach R2 identifiers and URLs to result
        result.output_video_r2_key = output_dest_key
        result.output_video_url = output_public_url
        result.annotated_media_url = output_public_url

        # 5. Clean up temporary files on local disk
        cleanup_path(tmp_dir)

        return result

    except HTTPException:
        cleanup_path(tmp_dir)
        raise
    except Exception as exc:
        cleanup_path(tmp_dir)
        logger.exception("Pipeline processing error")
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {exc}") from exc
