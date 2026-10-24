"""Test script to verify all model weights and pipeline components run without errors.
"""

import sys
from pathlib import Path

# Add models root directory to sys.path
MODELS_ROOT = Path(__file__).resolve().parent.parent
if str(MODELS_ROOT) not in sys.path:
    sys.path.insert(0, str(MODELS_ROOT))

import cv2
from src.config import settings
from src.detectors.accident import AccidentDetector
from src.detectors.helmet import HelmetDetector
from src.detectors.plate import PlateDetector
from src.detectors.seatbelt import SeatbeltDetector
from src.detectors.vehicle_speed import VehicleSpeedDetector


def test_models():
    print("=" * 60)
    print("Testing Cities of the Future - ML Detection Models")
    print("=" * 60)

    # 1. Test Vehicle / Speed detector
    print("\n[1/5] Testing Vehicle Detection Model (YOLOv8n)...")
    v_det = VehicleSpeedDetector()
    v_det.load()
    print(f"  Loaded successfully from: {settings.SPEED_MODEL_PATH}")

    # 2. Test Helmet detector
    print("\n[2/5] Testing Helmet Detection Model...")
    h_det = HelmetDetector()
    h_det.load()
    print(f"  Loaded successfully from: {settings.HELMET_MODEL_PATH}")

    # 3. Test Seatbelt detector
    print("\n[3/5] Testing Seatbelt Detection Model...")
    s_det = SeatbeltDetector()
    s_det.load()
    print(f"  Loaded successfully from: {settings.SEATBELT_MODEL_PATH}")

    # 4. Test Accident detector
    print("\n[4/5] Testing Accident Detection Model (EfficientNet)...")
    a_det = AccidentDetector()
    a_det.load()
    print(f"  Loaded successfully from: {settings.ACCIDENT_MODEL_PATH}")
    print(f"  Classes: {a_det.classes}")

    # 5. Test Plate detector
    print("\n[5/5] Testing Plate / ALPR Detector...")
    p_det = PlateDetector()
    p_det.load()
    print(f"  FastALPR available: {p_det._alpr_available}")
    test_plate = p_det.get_plate_for_track(42)
    print(f"  Sample generated plate for track #42: {test_plate[0]}")

    # Run inference on sample image if present
    sample_accident = MODELS_ROOT / "samples" / "accident_sample.png"
    if sample_accident.is_file():
        print(f"\nRunning test inference on sample: {sample_accident.name}")
        img = cv2.imread(str(sample_accident))
        status, conf, probs = a_det.predict_frame(img)
        print(f"  Accident result: {status} ({conf:.1%}) -> {probs}")

    sample_helmet = MODELS_ROOT / "samples" / "helmet_sample_1.png"
    if sample_helmet.is_file():
        print(f"\nRunning test inference on sample: {sample_helmet.name}")
        img = cv2.imread(str(sample_helmet))
        helm_results = h_det.predict_frame(img)
        print(f"  Helmet detections: {len(helm_results)}")
        for box, kind, name, conf in helm_results:
            print(f"    - {name} [{kind}] conf={conf:.2f} at {box}")

    print("\n" + "=" * 60)
    print("All Model Verifications Completed Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    test_models()
