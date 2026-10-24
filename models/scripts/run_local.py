"""Local runner script to process a local video or image through the multi-model pipeline
without running the FastAPI server.
"""

import argparse
import csv
import os
import sys
from pathlib import Path

# Add models root directory to sys.path
MODELS_ROOT = Path(__file__).resolve().parent.parent
if str(MODELS_ROOT) not in sys.path:
    sys.path.insert(0, str(MODELS_ROOT))

import cv2
from src.core.utils import is_image_file, is_video_file
from src.pipeline.orchestrator import MultiModelPipeline


def run_local_pipeline(
    input_path: str,
    output_path: str = None,
    report_path: str = None,
    expected_direction_deg: float = 90.0,
    direction_tolerance_deg: float = 90.0,
    speed_limit_kmh: float = 60.0,
):
    source = Path(input_path)
    if not source.is_file():
        raise FileNotFoundError(f"Input file not found: {source}")

    is_image = is_image_file(source.name)
    is_video = is_video_file(source.name)

    if not (is_image or is_video):
        raise ValueError(f"Unsupported file extension: {source.suffix}")

    output_dir = MODELS_ROOT / "processed_results"
    output_dir.mkdir(parents=True, exist_ok=True)

    ext = ".jpg" if is_image else ".mp4"
    final_output = output_path or str(output_dir / f"{source.stem}_annotated{ext}")
    final_report = report_path or str(output_dir / f"{source.stem}_report.csv")

    pipeline = MultiModelPipeline()

    print(f"Processing: {source} (type: {'image' if is_image else 'video'})")
    if is_image:
        image = cv2.imread(str(source))
        result = pipeline.process_image(
            input_image=image,
            output_path=final_output,
        )
    else:
        result = pipeline.process_video(
            video_path=str(source),
            output_path=final_output,
            expected_direction_deg=expected_direction_deg,
            direction_tolerance_deg=direction_tolerance_deg,
            speed_limit_kmh=speed_limit_kmh,
        )

    # Save CSV Report
    os.makedirs(os.path.dirname(final_report) or ".", exist_ok=True)
    with open(final_report, "w", newline="", encoding="utf-8") as f:
        fields = [
            "track_id",
            "number_plate",
            "plate_confidence",
            "generated_plate",
            "speed_kmh",
            "helmet_status",
            "seatbelt_status",
            "danger_score",
            "accident_status",
            "accident_confidence",
            "violations",
        ]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for v in result.vehicles:
            writer.writerow({
                "track_id": v.track_id,
                "number_plate": v.number_plate,
                "plate_confidence": v.plate_confidence,
                "generated_plate": v.generated_plate,
                "speed_kmh": v.speed_kmh if v.speed_kmh is not None else "N/A",
                "helmet_status": v.helmet_status,
                "seatbelt_status": v.seatbelt_status,
                "danger_score": v.danger_score,
                "accident_status": v.accident_status,
                "accident_confidence": v.accident_confidence,
                "violations": ";".join(v.violations) or "none",
            })

    print(f"Annotated media saved to: {final_output}")
    print(f"CSV report saved to:       {final_report}")
    print(f"Accident overall:          {result.accident_overall.status} ({result.accident_overall.confidence:.1%})")
    print(f"Vehicles identified:       {len(result.vehicles)}")
    print(f"Events generated:          {len(result.events)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process local traffic media through ML pipeline")
    parser.add_argument("--input", required=True, help="Path to input video or image")
    parser.add_argument("--output", help="Optional output path for annotated media")
    parser.add_argument("--report", help="Optional output path for CSV detection report")
    parser.add_argument("--direction", type=float, default=90.0, help="Expected traffic direction in degrees")
    parser.add_argument("--tolerance", type=float, default=90.0, help="Direction angular tolerance in degrees")
    parser.add_argument("--speed-limit", type=float, default=60.0, help="Speed limit in km/h")

    args = parser.parse_args()
    run_local_pipeline(
        input_path=args.input,
        output_path=args.output,
        report_path=args.report,
        expected_direction_deg=args.direction,
        direction_tolerance_deg=args.tolerance,
        speed_limit_kmh=args.speed_limit,
    )
