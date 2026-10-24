import hashlib
import os
from pathlib import Path
import random
import shutil
import tempfile
from typing import Generator, List, Optional, Set, Tuple
import cv2
import numpy as np

VIDEO_EXTENSIONS: Set[str] = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
IMAGE_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

INDIAN_STATES: List[str] = ["DL", "MH", "KA", "UP", "RJ", "TN", "GJ", "WB", "TS", "KL"]


def generate_synthetic_plate(track_id: int) -> str:
    """Generate a realistic, deterministic vehicle registration plate based on track ID."""
    seed_hash = hashlib.sha256(str(track_id).encode("utf-8")).hexdigest()[:12]
    rng = random.Random(int(seed_hash, 16))
    state = rng.choice(INDIAN_STATES)
    district = rng.randint(1, 99)
    letters = "".join(rng.choice("ABCDEFGHJKLMNPQRSTUVWXYZ") for _ in range(2))
    digits = rng.randint(1000, 9999)
    return f"{state}{district:02d}{letters}{digits}"


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_video_file(filename: str) -> bool:
    return get_file_extension(filename) in VIDEO_EXTENSIONS


def is_image_file(filename: str) -> bool:
    return get_file_extension(filename) in IMAGE_EXTENSIONS


def create_temp_dir(prefix: str = "cotf_ml_") -> str:
    return tempfile.mkdtemp(prefix=prefix)


def cleanup_path(path: str) -> None:
    if os.path.isdir(path):
        shutil.rmtree(path, ignore_errors=True)
    elif os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass


def decode_image_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """Decode raw bytes into a BGR numpy image array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def encode_image_bytes(image: np.ndarray, ext: str = ".jpg") -> bytes:
    """Encode an image array into bytes."""
    success, encoded = cv2.imencode(ext, image)
    if not success:
        raise ValueError("Failed to encode image to bytes")
    return encoded.tobytes()
