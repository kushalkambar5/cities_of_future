<p align="center">
  <img src="frontend/public/logo.png" alt="Navanagar Logo" width="100" height="100" />
</p>

<h1 align="center">Navanagar &bull; Cities of the Future</h1>

<p align="center">
  <strong>Intelligent, Fair, and Transparent Urban Traffic Safety &amp; Automated Enforcement Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.100%2B-teal?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-orange" alt="YOLOv8" />
  <img src="https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-blue?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Storage-Cloudflare%20R2-orange?logo=cloudflare" alt="Cloudflare R2" />
</p>

---

## Overview

**Navanagar** is an end-to-end smart city traffic monitoring and violation detection platform built to modernize traffic safety while eliminating unfair enforcement practices. By pairing high-performance computer vision with a human-in-the-loop verification protocol, Navanagar transforms roadside CCTV feeds into auditable, transparent enforcement events.

Unlike legacy speed traps and opaque photo systems, Navanagar is designed around **fair enforcement**:
- **Virtual Stop Line Buffers**: Tolerates gradual, safe braking so motorists are not penalized for touching a painted line.
- **Corridor Average Speed Enforcement**: Measures travel time across 2.5 km corridors to deter reckless driving without causing abrupt, hazardous spot braking.
- **Human Officer in the Loop**: AI detects events and calculates metric telemetry; sworn officers review and verify evidence before fines are dispatched.
- **Autonomous AI Auditing**: Leverages Google Nano Banana (Gemini) to cross-audit violation telemetry and weed out sensor false positives.
- **Instant WhatsApp Delivery & Online Settlement**: Motorists receive photo and video evidence within seconds via WhatsApp, with integrated 1-click disputes and online challan payment.

---

## Architecture

The system is organized into three interconnected tiers: a client dashboard, a central API and notification orchestrator, and a high-performance computer vision service.

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16 + Tailwind CSS)"]
        UI_Citizen["Citizen Portal\n(Fines, Evidence, Dispute)"]
        UI_Police["Police Command Center\n(Review & Verification)"]
        UI_Admin["Admin 3D Map & Simulation\n(MapLibre + Three.js)"]
    end

    subgraph Backend ["Backend API (Express 5 + TypeScript)"]
        API["REST API Router & Auth"]
        SimEngine["Simulation Controller"]
        PDFGen["Challan PDF Generator (pdf-lib)"]
        Notifier["Notification Dispatcher (OpenWA WhatsApp)"]
        AIAudit["AI Auditor (Google Nano Banana / Gemini)"]
        ChatCopilot["AI Traffic Assistant (OpenAI Agents SDK)"]
    end

    subgraph ML ["AI Detection Layer (Python + FastAPI)"]
        Pipeline["Orchestrator Pipeline"]
        YOLO_Speed["YOLOv8n + ByteTrack (Speed & Trajectory)"]
        YOLO_Helmet["Custom YOLOv8 (Helmet Detection)"]
        YOLO_Belt["Custom YOLOv8 (Seatbelt Detection)"]
        EffNet_Accident["EfficientNet-B0 (Accident Classifier)"]
        ANPR["FastALPR + Synthetic Generator (Plates)"]
        Kinematics["Kinematic Engine (Wrong-Way & Danger Score)"]
    end

    subgraph Storage ["Data & Media Storage"]
        PG[("PostgreSQL Database\n(Drizzle ORM)")]
        R2[("Cloudflare R2\n(Footage, Clips, Challan PDFs)")]
    end

    UI_Citizen --> API
    UI_Police --> API
    UI_Admin --> API

    API --> PG
    SimEngine --> Pipeline
    Pipeline --> YOLO_Speed & YOLO_Helmet & YOLO_Belt & EffNet_Accident & ANPR & Kinematics
    Pipeline --> R2
    SimEngine --> AIAudit
    SimEngine --> PDFGen --> R2
    SimEngine --> Notifier
    API --> ChatCopilot
```

---

## Core Capabilities & AI Models

| Detector / Module | Architecture / Model | Weights File | Description |
| :--- | :--- | :--- | :--- |
| **Vehicle Tracking & Speed** | YOLOv8n + ByteTrack | `weights/yolov8n.pt` | Multi-class vehicle tracking with perspective-transformed homography for metric speed (km/h) estimation. |
| **Helmet Compliance** | Custom YOLOv8 | `weights/helmet_best.pt` | High-precision binary classifier detecting helmet usage vs. unhelmeted rider/pillion violations. |
| **Seatbelt Compliance** | Custom YOLOv8 | `weights/seat_belt_best.pt` | Detects driver and passenger seatbelt adherence in passenger vehicles. |
| **Accident Detection** | EfficientNet-B0 | `weights/accident_model.pt` | Real-time collision and incident detection with temporal probability smoothing. |
| **ANPR / Plate Recognition** | FastALPR + Synthetic Engine | Algorithm + OCR | License plate bounding box extraction, OCR transcription, and deterministic vehicle track pairing. |
| **Wrong-Side & Kinematics** | Trajectory Kinematics Engine | Rule Engine | Detects counter-flow driving against lane vectors and computes an aggregate 0–100 Danger Score. |
| **AI Violation Auditor** | Google Nano Banana (Gemini) | Cloud API | Performs secondary sanity checks on raw sensor telemetry before human review or fine generation. |

---

## Key Features

### Role-Based Experiences
- **Citizen Portal**: Search by plate number, view high-definition timestamped evidence frames, inspect fine breakdowns, download official signed PDF challans, and file 1-click disputes.
- **Police Command Center**: Dedicated review dashboard allowing officers to confirm or reject flagged violations, preventing false automated penalties.
- **Admin Control Room & 3D Twin**: Interactive 3D junction visualization using MapLibre GL and Three.js with realistic `.glb` camera poles and traffic lights.

### Automated Simulation & Processing
- Upload CCTV footage or point directly to local video files.
- Process multiple sensor streams simultaneously against configurable speed limits and road vectors.
- Automatically produce annotated MP4 recordings and store evidence snapshots in Cloudflare R2.

### Real-Time Citizen Engagement
- Instant multi-channel notifications via WhatsApp (OpenWA integration) with direct links to photo proof.
- Embedded AI Traffic Copilot widget powered by OpenAI Agent SDK for automated citation inquiries, payment guidance, and road regulation questions.

---

## Project Structure

```text
cities_of_future/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/           # Environment and service configurations
│   │   ├── controllers/      # Auth, cameras, simulations, violations, chat
│   │   ├── db/               # PostgreSQL connection and Drizzle ORM schema
│   │   ├── middleware/       # JWT auth and error handling middleware
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # Cloudflare R2, WhatsApp, PDF challan, Nano Banana AI
│   │   └── utils/            # JWT and bcrypt helpers
│   ├── drizzle/              # Generated database migrations
│   └── package.json
│
├── frontend/                 # Next.js 16 + React 19 + Tailwind CSS Dashboard
│   ├── app/                  # App Router pages (admin, police, citizen, simulate)
│   ├── components/           # UI components, 3D Map, chat widget, user journeys
│   ├── lib/                  # Frontend API client and type definitions
│   ├── public/               # Static assets, branding logo, and 3D GLB models
│   └── package.json
│
├── models/                   # Python + FastAPI Computer Vision Inference Engine
│   ├── src/
│   │   ├── api/              # FastAPI application, dependencies, and routes
│   │   ├── core/             # Homography perspective warping, geometry, danger scoring
│   │   ├── detectors/        # Modular detector classes (speed, helmet, seatbelt, plate, etc.)
│   │   ├── pipeline/         # Multi-model orchestrator and OpenCV video annotator
│   │   └── schemas/          # Pydantic data models for detection contracts
│   ├── scripts/              # CLI batch processing and inference verification tools
│   ├── weights/              # Neural network weights (.pt files)
│   ├── main.py               # ML server entrypoint
│   └── requirements.txt
│
└── skills-lock.json          # Agent customization metadata
```

---

## Prerequisites

Before running the platform, ensure the following dependencies are installed on your workstation or host:

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **Python**: v3.10 – v3.12
- **PostgreSQL**: v14 or higher (running locally or accessible via network)
- **CUDA Toolkit** *(Optional)*: Recommended for hardware-accelerated YOLO inference on NVIDIA GPUs (falls back to CPU automatically)

---

## Getting Started

### 1. Clone Repository & Setup Environment

```bash
git clone https://github.com/your-org/cities_of_future.git
cd cities_of_future
```

### 2. Configure & Run Backend Database

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cities_of_future
   PORT=5000
   ```

4. Push the Drizzle schema to your database:
   ```bash
   npm run db:push
   ```

   > [!TIP]
   > You can launch Drizzle Studio at any time to visually inspect records:
   > ```bash
   > npm run db:studio
   > ```

5. Start the backend development server:
   ```bash
   npm run dev
   # In a separate terminal or once built:
   npm start
   ```
   The backend API will be available at `http://localhost:5000`.

---

### 3. Setup & Run ML Detection Service

1. Open a new terminal and navigate to the `models` directory:
   ```bash
   cd models
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify model weights and configuration:
   ```bash
   python scripts/test_inference.py
   ```

5. Launch the FastAPI server:
   ```bash
   python main.py
   # Or using uvicorn:
   uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload
   ```
   FastAPI interactive documentation will be accessible at `http://localhost:8000/docs`.

---

### 4. Setup & Run Frontend Application

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure the API target points to your running backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to access the portal.

---

## API Reference

### Backend Endpoints (`http://localhost:5000/api`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck and service status confirmation. |
| `POST` | `/auth/register` | Register new citizen, police, or administrator account. |
| `POST` | `/auth/login` | Authenticate and obtain JWT bearer token. |
| `GET` | `/cameras` | Retrieve all registered CCTV camera assets and assigned streams. |
| `POST` | `/simulation/run` | Execute multi-model video analysis via the ML engine. |
| `GET` | `/violations` | Fetch detected and verified violations with filter support. |
| `POST` | `/violations/:id/verify` | Officer verification action (`VERIFIED` / `REJECTED`). |
| `GET` | `/fines/:plate` | Fetch pending and paid fines associated with a license plate. |
| `POST` | `/fines/:id/pay` | Settle an issued challan online. |
| `POST` | `/chat/message` | Submit query to the traffic copilot assistant. |

### ML Inference Endpoints (`http://localhost:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Verifies GPU acceleration and confirms weight availability. |
| `POST` | `/pipeline/process` | Full end-to-end multi-model inference pipeline on video/image. |
| `POST` | `/detect/speed` | Dedicated vehicle tracking and corridor speed computation. |
| `POST` | `/detect/helmet` | Helmet and rider violation inference on uploaded frame. |
| `POST` | `/detect/seatbelt` | Seatbelt compliance detection on uploaded frame. |
| `POST` | `/detect/plate` | ANPR bounding box and plate OCR transcription. |
| `POST` | `/detect/accident` | EfficientNet classification for collision and road incident detection. |
| `POST` | `/detect/wrong-side` | Trajectory direction assessment against road vector angle. |

---

## Configuration Reference

The following environment variables configure the platform across services:

| Component | Variable | Purpose |
| :--- | :--- | :--- |
| **Backend** | `DATABASE_URL` | PostgreSQL connection string. |
| **Backend** | `PORT` | HTTP port for the Express server (default: `5000`). |
| **Backend** | `JWT_SECRET` | Secret key used to sign and verify authentication tokens. |
| **Backend** | `R2_ENDPOINT` | Cloudflare R2 S3-compatible API endpoint URL. |
| **Backend** | `R2_ACCESS_KEY_ID` | Cloudflare R2 access key. |
| **Backend** | `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key. |
| **Backend** | `R2_BUCKET` | Destination bucket name for media and challan PDFs. |
| **Backend** | `OPENWA_SERVER_URL` | OpenWA automation HTTP gateway URL for WhatsApp dispatch. |
| **Backend** | `FASTAPI_ML_SERVICE_URL` | URL of the running FastAPI ML detection layer. |
| **Backend** | `GOOGLE_API_KEY` | Gemini API key for Google Nano Banana violation audits. |
| **Backend** | `OPENAI_API_KEY` | API key for the AI traffic assistant chatbot. |
| **Frontend** | `NEXT_PUBLIC_API_URL` | Base URL of the backend REST API. |
| **Models** | `PORT` | HTTP port for FastAPI (default: `8000`). |
| **Models** | `SPEED_LIMIT_KMH` | Default speed limit threshold in km/h (default: `60.0`). |
| **Models** | `DEFAULT_CONFIDENCE` | Default inference threshold for neural detectors. |
| **Models** | `FORCE_CPU` | Set to `true` to disable CUDA acceleration. |

> [!NOTE]
> If Cloudflare R2 or OpenWA credentials are not configured in your development environment, the platform operates gracefully with local storage fallbacks and terminal warning logs.
