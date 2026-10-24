from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .events import DetectionEventItem


class BoundingBoxModel(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class SingleDetectionResponse(BaseModel):
    success: bool = True
    message: str = "Detection successful"
    detections: List[Dict[str, Any]] = Field(default_factory=list)


class VehicleDetection(BaseModel):
    track_id: int
    bbox: BoundingBoxModel
    class_id: int
    class_name: str
    confidence: float


class SpeedDetection(BaseModel):
    track_id: int
    speed_kmh: float
    is_overspeed: bool
    speed_limit_kmh: float
    confidence: float = 1.0


class HelmetDetection(BaseModel):
    bbox: BoundingBoxModel
    label: str
    kind: str  # "helmet", "no_helmet", "other"
    confidence: float
    associated_track_id: Optional[int] = None


class SeatbeltDetection(BaseModel):
    bbox: BoundingBoxModel
    label: str
    kind: str  # "belt", "no_belt"
    confidence: float
    associated_track_id: Optional[int] = None


class PlateDetection(BaseModel):
    bbox: Optional[BoundingBoxModel] = None
    plate_number: str
    confidence: float
    is_synthetic: bool = False
    associated_track_id: Optional[int] = None


class AccidentDetection(BaseModel):
    accident_detected: bool
    status: str  # "Accident" or "Non Accident"
    confidence: float
    class_probabilities: Dict[str, float] = Field(default_factory=dict)


class WrongSideDetection(BaseModel):
    track_id: int
    is_wrong_side: bool
    current_heading_deg: float
    expected_heading_deg: float
    heading_diff_deg: float


class VehicleReportSummary(BaseModel):
    track_id: int
    number_plate: str
    plate_confidence: float
    generated_plate: bool
    speed_kmh: Optional[float] = None
    helmet_status: str
    seatbelt_status: str
    danger_score: float
    accident_status: str
    accident_confidence: float
    violations: List[str]
    first_seen_ms: Optional[int] = None
    last_seen_ms: Optional[int] = None
    first_seen_timestamp: Optional[str] = None
    last_seen_timestamp: Optional[str] = None


class PipelineProcessR2Request(BaseModel):
    r2_video_key: Optional[str] = Field(None, description="Cloudflare R2 video file key ID")
    file_path: Optional[str] = Field(None, description="Direct local filesystem video path")
    camera_id: str = Field("CAM_01", description="Camera or sensor identifier")
    simulation_id: Optional[int] = Field(None, description="Simulation ID if applicable")
    speed_limit_kmh: float = Field(60.0, description="Speed limit in km/h")
    expected_direction_deg: float = Field(90.0, description="Expected heading direction in degrees")
    direction_tolerance_deg: float = Field(90.0, description="Direction angular tolerance in degrees")
    output_r2_prefix: str = Field("processed", description="Folder/prefix for output video in Cloudflare R2")


class PipelineProcessResult(BaseModel):
    success: bool = True
    media_type: str = "video"
    total_frames_processed: int
    duration_seconds: Optional[float] = None
    output_video_r2_key: Optional[str] = None
    output_video_url: Optional[str] = None
    annotated_media_url: Optional[str] = None
    accident_overall: AccidentDetection
    vehicles: List[VehicleReportSummary]
    events: List[DetectionEventItem]
    detected_timestamps: Dict[str, List[float]] = Field(
        default_factory=dict,
        description="Timestamps in seconds for detected incidents and events",
    )
