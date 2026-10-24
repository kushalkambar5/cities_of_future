import os
from pathlib import Path
from typing import List, Tuple
from pydantic import Field
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    # Graceful fallback if pydantic-settings is not installed yet
    from pydantic import BaseModel as BaseSettings  # type: ignore
    SettingsConfigDict = None  # type: ignore

# Root directory of the models service
MODELS_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DEFAULT_DIR = MODELS_DIR / "weights"


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Cities of the Future - ML Detection Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]
    MAX_UPLOAD_BYTES: int = 500 * 1024 * 1024  # 500 MB

    # Paths
    BASE_DIR: Path = MODELS_DIR
    WEIGHTS_DIR: Path = WEIGHTS_DEFAULT_DIR
    OUTPUT_DIR: Path = MODELS_DIR / "output"
    
    # Model Weights Paths
    SPEED_MODEL_PATH: str = str(WEIGHTS_DEFAULT_DIR / "yolov8n.pt")
    HELMET_MODEL_PATH: str = str(WEIGHTS_DEFAULT_DIR / "helmet_best.pt")
    SEATBELT_MODEL_PATH: str = str(WEIGHTS_DEFAULT_DIR / "seat_belt_best.pt")
    ACCIDENT_MODEL_PATH: str = str(WEIGHTS_DEFAULT_DIR / "accident_model.pt")

    # Tracking & Vehicle Detection
    TRACKER_CONFIG: str = "bytetrack.yaml"
    VEHICLE_CLASSES: List[int] = [2, 3, 5, 7]  # car, motorcycle, bus, truck
    DEFAULT_CONFIDENCE: float = 0.30
    SEATBELT_CONFIDENCE: float = 0.25
    ACCIDENT_CONFIDENCE: float = 0.50
    BATCH_SIZE: int = 16

    # Speed & Perspective Calibration
    SPEED_LIMIT_KMH: float = 60.0
    SPEED_SCALE: float = 0.3
    SPEED_OFFSET: float = 10.0
    ROAD_WIDTH_METERS: float = 3.6
    ROAD_LENGTH_METERS: float = 18.0

    # Default perspective transformation points (quadrilateral ROI -> real-world rectangle)
    # [ [top-left], [top-right], [bottom-right], [bottom-left] ]
    DEFAULT_SOURCE_POINTS: List[Tuple[float, float]] = [
        (1252.0, 787.0),
        (2298.0, 803.0),
        (5039.0, 2159.0),
        (-550.0, 2159.0),
    ]

    # Traffic Flow / Direction
    DEFAULT_EXPECTED_DIRECTION_DEG: float = 90.0
    DEFAULT_DIRECTION_TOLERANCE_DEG: float = 90.0

    # Device
    FORCE_CPU: bool = False

    # Cloudflare R2 Storage Configuration
    R2_BUCKET: str = ""
    R2_PUBLIC_URL: str = ""
    R2_ENDPOINT: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_TOKEN_VALUE: str = ""

    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(
            env_file=str(MODELS_DIR / ".env"),
            env_file_encoding="utf-8",
            extra="ignore",
        )


settings = Settings()
