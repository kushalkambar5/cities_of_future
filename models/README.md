# Cities of the Future - ML Detection & Traffic Safety Service

High-performance, scalable computer vision inference engine for traffic monitoring, safety compliance, and violation detection.

This service serves as the AI Detection Layer for the **Cities of the Future** smart traffic management platform. It exposes modular FastAPI endpoints for individual neural detectors as well as a multi-model pipeline engine.

---

## 1. Directory Structure

```text
models/
├── weights/                       # Clean repository for all trained model weights (.pt)
│   ├── yolov8n.pt                 # Vehicle detector & ByteTrack tracker
│   ├── helmet_best.pt             # Rider helmet / no-helmet detector
│   ├── seat_belt_best.pt          # Seatbelt / no-seatbelt detector
│   └── accident_model.pt          # Accident classifier (EfficientNet-B0)
│
├── samples/                       # Sample validation images for testing
│   ├── accident_sample.png
│   ├── helmet_sample_1.png
│   └── helmet_sample_2.png
│
├── src/
│   ├── config.py                  # Dynamic configuration (paths, thresholds, calibrations)
│   │
│   ├── core/                      # Foundation algorithms and math utilities
│   │   ├── geometry.py            # IoU, bbox association, containment logic
│   │   ├── perspective.py         # Perspective warp: camera pixels -> real-world meters
│   │   ├── danger.py              # Spatial-temporal trajectory, danger score (0-100)
│   │   └── utils.py               # File I/O, image encoding, deterministic plate generator
│   │
│   ├── detectors/                 # Modular AI detector classes
│   │   ├── base.py                # BaseDetector interface
│   │   ├── vehicle_speed.py       # YOLOv8n + ByteTrack + perspective speed estimation
│   │   ├── helmet.py              # Helmet vs No Helmet detector
│   │   ├── seatbelt.py            # Seatbelt compliance detector
│   │   ├── plate.py               # License plate ANPR + fallback generator
│   │   ├── accident.py            # EfficientNet-B0 accident classifier
│   │   └── wrong_side.py          # Trajectory heading vs road direction detector
│   │
│   ├── pipeline/                  # Multi-model orchestrator
│   │   ├── orchestrator.py        # Cohesive pipeline coordinating all models
│   │   └── renderer.py            # OpenCV visual annotation & alert overlays
│   │
│   ├── schemas/                   # Pydantic data models & contracts
│   │   ├── detection.py           # Typed detection results & report summaries
│   │   └── events.py              # Standardized DetectionEvent matching backend schema
│   │
│   └── api/                       # FastAPI application & routing
│       ├── dependencies.py        # Model lazy loading & singleton dependency injection
│       ├── routes/
│       │   ├── health.py          # GET /health, /ready
│       │   ├── detect.py          # Individual endpoints (/detect/speed, /detect/helmet, etc.)
│       │   └── pipeline.py        # Integrated pipeline (/pipeline/process)
│       └── app.py                 # FastAPI application factory with CORS middleware
│
├── scripts/
│   ├── run_local.py               # CLI tool to process videos/images directly
│   └── test_inference.py          # Verification script to test all models
│
├── main.py                        # Entrypoint to run server or CLI
├── requirements.txt               # Dependencies
├── .env.example                   # Environment variable template
└── README.md                      # Documentation
```

---

## 2. Models & Capabilities

| Capability | Model Architecture | Weights File | Description |
| :--- | :--- | :--- | :--- |
| **Vehicle Tracking & Speed** | YOLOv8n + ByteTrack | `weights/yolov8n.pt` | Detects cars, buses, trucks, motorcycles. Warps trajectory to metric coordinates to estimate km/h. |
| **Helmet Detection** | Custom YOLOv8 | `weights/helmet_best.pt` | Detects helmet compliance vs rider violation (`no_helmet`). |
| **Seatbelt Detection** | Custom YOLOv8 | `weights/seat_belt_best.pt` | Detects driver/passenger seatbelt compliance vs violation (`no_belt`). |
| **Accident Detection** | EfficientNet-B0 | `weights/accident_model.pt` | Binary classification: `Accident` vs `Non Accident` with temporal smoothing. |
| **ANPR / Plate Recognition** | FastALPR / Synthetic | Algorithm + ALPR | Extracts registration plate characters with deterministic fallback for tracked vehicles. |
| **Wrong-Side & Aggressive Driving** | Trajectory Kinematics | Rule-based engine | Flags counter-flow driving, sudden braking, erratic zig-zags, and computes a 0-100 Danger Score. |

---

## 3. Installation & Setup

### Prerequisites
- Python 3.10 - 3.12 recommended.
- CUDA-enabled GPU (optional; falls back to CPU automatically).

### Setup Environment
```bash
# Navigate to models folder
cd E:\Codes\cities_of_future\models

# Create a virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 4. Running the Service

### Run FastAPI Server
```bash
python main.py
# Or using uvicorn directly:
uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at: **`http://localhost:8000/docs`**

---

## 5. API Endpoints

### 5.1 Health Check
- **`GET /health`**: Returns service status, GPU device info, and verifies all 4 model weight files exist on disk.

### 5.2 Individual Detectors
- **`POST /detect/speed`**: Estimates vehicle speeds from a video clip.
- **`POST /detect/helmet`**: Detects helmets and helmet violations on an image.
- **`POST /detect/seatbelt`**: Detects seatbelt compliance on an image.
- **`POST /detect/plate`**: Detects number plates and reads OCR text on an image.
- **`POST /detect/accident`**: Classifies accident presence and probabilities on an image.
- **`POST /detect/wrong-side`**: Validates whether trajectory coordinates violate road direction.

### 5.3 Integrated Multi-Model Pipeline
- **`POST /pipeline/process`**:
  Uploads an image or video and runs all detectors simultaneously:
  - Form parameters:
    - `camera_id` (str, default: `"CAM_01"`)
    - `simulation_id` (int, optional)
    - `speed_limit_kmh` (float, default: `60.0`)
    - `expected_direction_deg` (float, default: `90.0`)
    - `direction_tolerance_deg` (float, default: `90.0`)
    - `return_annotated_file` (bool, default: `false`)
  - **Output**:
    - If `return_annotated_file=false`: Returns structured JSON containing vehicle summaries, violations, danger scores, and database-ready `detection_events`.
    - If `return_annotated_file=true`: Returns annotated MP4/JPEG file.

---

## 6. Backend Integration (`detection_events`)

The pipeline generates event payloads matching the Node.js backend's `detection_events` database schema:

```json
{
  "camera_id": "CAM_01",
  "simulation_id": 1,
  "vehicle_track_id": "3",
  "plate_number": "KA01AB1234",
  "event_type": "SPEED",
  "simulation_time_ms": 1200,
  "confidence": 0.95,
  "data": {
    "speed_kmh": 82.5,
    "speed_limit_kmh": 60.0
  }
}
```

Supported `event_type`s:
- `SPEED`
- `HELMET`
- `PLATE`
- `WRONG_SIDE`
- `SEATBELT`
- `ACCIDENT`

---

## 7. Command-Line Processing (CLI)

Run processing directly on local media without starting the HTTP server:

```bash
# Process a video and save annotated MP4 + CSV report:
python scripts/run_local.py --input sample_video.mp4 --speed-limit 60.0

# Or via main.py:
python main.py --input sample_video.mp4 --output out.mp4 --report out.csv
```

To run model verification:
```bash
python scripts/test_inference.py
```
