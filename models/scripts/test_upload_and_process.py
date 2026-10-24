import json
import os
import sys
from pathlib import Path

# Add models root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.core.r2 import upload_file_to_r2, settings
from src.pipeline.orchestrator import MultiModelPipeline

VIDEOS_DIR = Path(r"C:\Users\kusha\Downloads\dfhsd\CCTV videos")

def main():
    video_files = list(VIDEOS_DIR.glob("*.mp4"))
    print(f"Found {len(video_files)} videos in {VIDEOS_DIR}", flush=True)

    pipeline = MultiModelPipeline()
    pipeline.preload_all()

    all_detected_vehicles = {}
    r2_uploaded_keys = {}

    for video_path in video_files:
        print(f"\n==========================================", flush=True)
        print(f"Processing video: {video_path.name}", flush=True)
        r2_key = f"videos/{video_path.name}"
        
        # 1. Upload to R2
        try:
            public_url = upload_file_to_r2(str(video_path), r2_key, content_type="video/mp4")
            print(f"Uploaded to R2: {r2_key} -> {public_url}", flush=True)
            r2_uploaded_keys[video_path.name] = r2_key
        except Exception as e:
            print(f"R2 upload status/error: {e}", flush=True)

        # 2. Process locally to test detection and extract plates
        try:
            result = pipeline.process_video(
                video_path=str(video_path),
                output_path=None,
                camera_id="CAM_01",
            )
            print(f"Frames processed: {result.total_frames_processed}", flush=True)
            print(f"Vehicles detected: {len(result.vehicles)}", flush=True)
            for v in result.vehicles:
                plate = v.number_plate.strip().upper()
                if not plate:
                    continue
                if plate not in all_detected_vehicles:
                    all_detected_vehicles[plate] = {
                        "plate_number": plate,
                        "track_id": v.track_id,
                        "video": video_path.name,
                        "is_synthetic": v.generated_plate,
                        "plate_confidence": round(v.plate_confidence, 2),
                        "violations": v.violations,
                        "helmet_status": v.helmet_status,
                        "seatbelt_status": v.seatbelt_status,
                        "speed_kmh": v.speed_kmh,
                    }
        except Exception as exc:
            print(f"Processing error: {exc}", flush=True)

    print("\n\n==========================================", flush=True)
    print("ALL DETECTED VEHICLE NUMBERS ACROSS 3 CCTV VIDEOS:", flush=True)
    print("==========================================", flush=True)
    for plate, info in all_detected_vehicles.items():
        print(f"Plate: {plate:15} | Source: {info['video']:40} | Violations: {info['violations']}", flush=True)

    # Save to JSON file for DB registration
    output_json_path = ROOT_DIR.parent / "detected_vehicles.json"
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(list(all_detected_vehicles.values()), f, indent=2)
    print(f"\nSaved {len(all_detected_vehicles)} detected vehicles to {output_json_path}", flush=True)

if __name__ == "__main__":
    main()
