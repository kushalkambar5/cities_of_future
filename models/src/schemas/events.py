from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DetectionEventType(str, Enum):
    SPEED = "SPEED"
    HELMET = "HELMET"
    PLATE = "PLATE"
    WRONG_SIDE = "WRONG_SIDE"
    SEATBELT = "SEATBELT"
    ACCIDENT = "ACCIDENT"


class DetectionEventItem(BaseModel):
    """Standardized detection event format matching backend detection_events table."""
    simulation_id: Optional[int] = Field(None, description="Simulation ID if applicable")
    camera_id: str = Field("CAM_DEFAULT", description="Camera or sensor identifier")
    vehicle_track_id: Optional[str] = Field(None, description="Vehicle tracking ID")
    plate_number: Optional[str] = Field(None, description="Recognized or synthetic plate")
    event_type: DetectionEventType = Field(..., description="Type of detection event")
    simulation_time_ms: int = Field(0, description="Timestamp in milliseconds from start")
    timestamp_sec: Optional[float] = Field(None, description="Timestamp in seconds from start")
    timestamp_formatted: Optional[str] = Field(None, description="Formatted timestamp mm:ss.ms")
    confidence: Optional[float] = Field(None, description="Model confidence score")
    data: Dict[str, Any] = Field(default_factory=dict, description="Event payload/details")
