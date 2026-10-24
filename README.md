# Smart Traffic & Violation Detection System

## 1. System Overview

The system is divided into six major layers:

```
┌─────────────────────────────────────────────────────┐
│                  1. AUTHENTICATION                  │
│              Citizen / Police / Admin              │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                2. 3D COMMAND CENTER                │
│        OpenFreeMap + MapLibre + 3D Objects         │
│          CCTV + Traffic Lights + Events            │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                 3. CCTV PROCESSING                  │
│       Uploaded Videos → Background Processing      │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                  4. AI DETECTION                   │
│ Speed │ Helmet │ ANPR │ Wrong Side │ Other Models │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                5. VIOLATION & FINE                 │
│ Rules → Vehicle DB → Evidence → Fine → WhatsApp  │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                  6. USER PORTALS                   │
│       Citizen │ Police │ Admin │ Analytics        │
└─────────────────────────────────────────────────────┘
```

---

# 2. Authentication & Role-Based Access

The system has **three roles**:

- Citizen
- Police
- Admin

## 2.1 Citizen

### Authentication

- Login
- Register
- Logout
- Session management

### Vehicle

- View registered vehicles
- View vehicle details

### Violations

- View violations
- View violation details
- View evidence
- View violation history

### Fines

- View pending fines
- View paid fines
- View penalty history
- View fine details

### Payment

- `UNPAID → PAYMENT DONE → PAID`

> For the hackathon, this is a payment-status simulation rather than a real payment gateway.
> 

### Notifications

- View violation notifications
- View penalty notifications

---

# 3. Police Portal

## 3.1 Command Center

Police can:

- View 3D city
- View CCTV locations
- View traffic lights
- View active violations
- View alerts
- View hotspots

## 3.2 CCTV Monitoring

- View CCTV list
- View CCTV footage
- View CCTV status
- Select CCTV from 3D map
- View current detections

Example:

```
CCTV-03

Location:
MG Road Junction

Status:
● Processing

Current Detections:

🚗 KA01AB1234
⚡ 67 km/h
🚦 RED LIGHT

Violations:
2
```

## 3.3 Vehicle Search

Police can search:

```
Vehicle Number
     ↓
Vehicle Details
     ↓
Owner
     ↓
Violation History
     ↓
Fine History
```

## 3.4 Violation Verification

Police can:

- View detected violation
- View evidence image
- View evidence video
- View AI confidence
- Verify violation
- Reject violation

Workflow:

```
AI Detection
     ↓
Pending Verification
     ↓
 ┌───────────┐
 │           │
 ▼           ▼
VERIFY      REJECT
 │
 ▼
Fine Issued
```

---

# 4. Admin Portal

The admin has full platform access.

## 4.1 User Management

- View users
- Create users
- Manage police
- Manage citizens
- Assign roles
- Disable users

## 4.2 Vehicle Registry

Admin manually maintains:

```
Vehicle Number
Owner Name
Phone Number
Vehicle Type
```

Example:

```
KA01AB1234
     ↓
Rahul Sharma
     ↓
+91XXXXXXXXXX
```

## 4.3 CCTV Management

Admin can:

- Create CCTV
- Edit CCTV
- Delete CCTV
- View CCTV
- Configure CCTV location
- Configure speed limit
- Associate traffic light
- Upload CCTV video

## 4.4 Traffic Light Management

Admin can:

- Create traffic light
- Edit traffic light
- Delete traffic light
- Configure traffic light location
- Associate CCTV

---

# 5. 3D Traffic Command Center

## Technology

```
OpenFreeMap
      +
MapLibre GL JS
      +
3D Models
```

## 5.1 Map Objects

The 3D map contains:

- Roads
- CCTV cameras
- Traffic lights
- Violation markers
- Accident markers
- Hotspots
- Traffic events

## 5.2 CCTV 3D Object

Each CCTV is represented as a 3D object.

```
       📷
       │
       │ CCTV
       │
═══════╪════════ ROAD
```

## 5.3 Traffic Light 3D Object

Each traffic light is represented as a 3D object.

```
       🚦
       │
       │
═══════╪════════ ROAD
```

## 5.4 CCTV Status

```
🟢 Processing
🟡 Warning
🔴 Violation Detected
⚪ Offline
```

## 5.5 Map Interaction

Clicking a CCTV opens:

```
CCTV INFORMATION

CCTV-03
MG Road Junction

Status:
● Processing

Video:
[ CCTV VIDEO ]

Current Detections:
KA01AB1234
67 km/h
RED LIGHT

Violations:
2
```

---

# 6. Admin CCTV Configuration

## 6.1 Create Traffic Light

Admin selects a location directly from the map.

Fields:

```
Traffic Light Name
Latitude
Longitude
```

Workflow:

```
Admin
  ↓
Create Traffic Light
  ↓
Select location on map
  ↓
Save
  ↓
3D Traffic Light appears
```

---

# 7. Create CCTV

Admin selects the CCTV location directly from the map.

Fields:

```
CCTV Name
Latitude
Longitude
Speed Limit
Associated Traffic Light
```

Workflow:

```
Admin
  ↓
Create CCTV
  ↓
Select location on map
  ↓
Configure speed limit
  ↓
Associate traffic light
  ↓
Save
```

---

# 8. CCTV Video Simulation

Since the current system does not use real CCTV streams, uploaded videos act as simulated CCTV feeds.

## 8.1 Admin Upload

Admin uploads:

```
CCTV-01 → video-01.mp4
CCTV-02 → video-02.mp4
CCTV-03 → video-03.mp4
...
```

At the same time, admin configures the **initial traffic-light states**.

For the demo:

```
Traffic Light 1 → RED
Traffic Light 2 → RED
Traffic Light 3 → RED
```

## 8.2 Start Simulation

Admin clicks:

```
┌─────────────────────┐
│   START SIMULATION   │
└─────────────────────┘
```

At this point:

> **All uploaded videos and traffic-light states are synchronized to simulation time `t = 0`.**
> 

Then the system starts processing.

```
t = 0

CCTV-01 ─────▶ Video starts
CCTV-02 ─────▶ Video starts
CCTV-03 ─────▶ Video starts

Traffic Light 1 ──▶ RED
Traffic Light 2 ──▶ RED
Traffic Light 3 ──▶ RED
```

---

# 9. Simulation Control

Admin:

```
┌───────────────────┐
│ START SIMULATION  │
└───────────────────┘

┌───────────────────┐
│  STOP SIMULATION  │
└───────────────────┘
```

System status:

```
CCTV-01   🟢 Processing
CCTV-02   🟢 Processing
CCTV-03   🟢 Processing
CCTV-04   ⚪ Stopped
```

---

# 10. AI Detection Layer

The AI layer is exposed through FastAPI.

## Current Models

### 10.1 Speed Detection

Detect:

```
Vehicle
+
Speed
+
Timestamp
+
Confidence
```

### 10.2 Helmet Detection

Detect:

```
Vehicle
+
Helmet Status
+
Confidence
```

### 10.3 Number Plate Detection / ANPR

Detect:

```
Vehicle
+
Number Plate
+
Confidence
```

Example:

```
KA01AB1234
```

### 10.4 Wrong-Side Detection

Detect:

```
Vehicle
+
Wrong-Side Status
+
Confidence
```

---

# 11. FastAPI ML Service

Recommended endpoints:

```
POST /detect/speed
POST /detect/helmet
POST /detect/plate
POST /detect/wrong-side
```

The ML service returns **detections**, not fines.

Example:

```
Video
 ↓
FastAPI
 ↓
ML Model
 ↓
Detection
```

Then the backend decides whether that detection becomes a violation.

---

# 12. Detection Event Engine

All ML outputs should be converted into a common event format.

```
AI Detection
     ↓
Detection Event
     ↓
Violation Engine
```

Example:

```
Detection Event

Vehicle:
KA01AB1234

Camera:
CCTV-03

Timestamp:
10:42:13

Type:
SPEED

Value:
87 km/h

Confidence:
94%
```

---

# 13. Violation Engine

The violation engine converts **detections + system conditions** into violations.

```
                 Detection Events
                       │
                       ▼
                ┌──────────────┐
                │ RULE ENGINE  │
                └──────┬───────┘
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Speeding       Red Light         Wrong Side
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                    Violation
```

Supported violations:

- Overspeeding
- Red-light jumping
- Wrong-side driving
- Helmet violation

---

# 14. Red-Light Violation

This should be handled by the backend rule engine.

Inputs:

```
Traffic Light State
+
Vehicle Detection
+
Vehicle Speed
+
Vehicle Position
+
Number Plate
```

Example:

```
Traffic Light
     ↓
RED
     ↓
Vehicle detected
     ↓
Vehicle crosses stop line
     ↓
Speed > threshold
     ↓
Number Plate detected
     ↓
RED-LIGHT VIOLATION
```

### Important

Don't use only:

```
RED + speed != 0
```

because a vehicle can be moving while approaching a red light.

Use a **virtual stop line / violation zone**.

---

# 15. Overspeeding Detection

## Method 1 — CCTV-Based Speed

```
Vehicle
   ↓
AI Speed Detection
   ↓
87 km/h
   ↓
Speed Limit = 60 km/h
   ↓
87 > 60
   ↓
OVERSPEEDING
```

---

# 16. Speed Detection Between Two CCTVs

This handles roads where there is no CCTV between two known cameras.

## Example

```
CCTV-01                         CCTV-02

📷                               📷
│                                │
│────────── 2.5 km ─────────────│
```

Vehicle:

```
KA01AB1234
```

### CCTV-01

```
10:00:00
```

### CCTV-02

```
10:01:30
```

### Calculation

```
Distance = 2.5 km

Time = 90 seconds
     = 0.025 hours

Average Speed
= Distance / Time

= 2.5 / 0.025

= 100 km/h
```

Speed limit:

```
60 km/h
```

Therefore:

```
100 > 60

→ OVERSPEEDING
```

## Backend Flow

```
CCTV-01
   ↓
Vehicle detected
   ↓
Plate detected
   ↓
Store plate + timestamp
   ↓
Road Segment
   ↓
CCTV-02
   ↓
Same plate detected
   ↓
Retrieve first timestamp
   ↓
Calculate distance / time
   ↓
Calculate average speed
   ↓
Compare with speed limit
   ↓
Violation
```

---

# 17. Violation Record

Every violation should contain:

```
Violation ID
Vehicle Number
Violation Type
Camera
Timestamp
Location
AI Confidence
Evidence Image
Evidence Video
Fine Amount
Status
```

Example:

```
Violation ID:
V1023

Vehicle:
KA01AB1234

Type:
Overspeeding

Camera:
CCTV-03

Speed:
87 km/h

Speed Limit:
60 km/h

Location:
MG Road

Confidence:
94%

Status:
Pending Verification
```

---

# 18. Evidence Management

For every violation:

```
Original CCTV Video
        +
Violation Frame
        +
Timestamp
        +
Camera
        +
Location
        +
AI Confidence
```

The violation page should show:

```
Evidence

[ IMAGE ]

[ VIDEO ]

Timestamp:
10:42:13

Camera:
CCTV-03

Location:
MG Road Junction

AI Confidence:
94%
```

---

# 19. Vehicle Registry

Admin maintains the vehicle database manually.

```
Vehicle
──────────────
Number Plate
Owner
Phone Number
Vehicle Type
```

Example:

```
KA01AB1234
     │
     ├── Owner: Rahul Sharma
     ├── Phone: +91XXXXXXXXXX
     └── Type: Car
```

---

# 20. Enforcement Pipeline

Once a violation is detected:

```
Violation
    ↓
Number Plate
    ↓
Vehicle DB
    ↓
Owner
    ↓
Phone Number
    ↓
Fine Calculation
    ↓
Evidence
    ↓
Penalty PDF
    ↓
WhatsApp
```

---

# 21. Fine Generation

Example:

```
TRAFFIC VIOLATION

Vehicle:
KA01AB1234

Violation:
Overspeeding

Detected Speed:
87 km/h

Speed Limit:
60 km/h

Location:
MG Road

Time:
10:42 AM

Fine:
₹1,000

Evidence:
[View Evidence]
```

---

# 22. WhatsApp Notification

## Pipeline

```
Violation
     ↓
Fine Generated
     ↓
Penalty PDF Generated
     ↓
WhatsApp Service
     ↓
Vehicle Owner
```

## Message

```
🚨 Traffic Violation Detected

Vehicle:
KA01AB1234

Violation:
Overspeeding

Detected Speed:
87 km/h

Speed Limit:
60 km/h

Fine:
₹1,000

Please visit the Smart Traffic Portal
to view your violation and evidence.
```

---

# 23. Citizen Portal

## Dashboard

```
Hello Rahul 👋

MY VEHICLES

┌──────────────────────┐
│ KA01AB1234           │
│ Honda City           │
└──────────────────────┘

Outstanding Penalties
₹2,000

Violations
3

Paid
1
```

---

# 24. Citizen Violation Page

```
Violation #V1023

🚦 Red Light Violation

Vehicle:
KA01AB1234

Date:
24 Oct 2026

Time:
10:32 AM

Location:
MG Road Junction

Fine:
₹1,000

Evidence:
[ Video ]
[ Image ]

Status:
UNPAID

[ MARK PAYMENT DONE ]
```

---

# 25. Payment Status

For the hackathon:

```
UNPAID
   │
   ▼
User clicks
"PAYMENT DONE"
   │
   ▼
PAID
```

This is a **payment simulation**, not an actual financial transaction.

---

# 26. Police Dashboard

```
┌──────────────────────────────────────────────┐
│           TRAFFIC COMMAND CENTER             │
├──────────┬──────────┬──────────┬─────────────┤
│   CCTV   │VIOLATIONS│  ALERTS  │    FINES    │
│    12    │    47    │    8     │   ₹42,000  │
└──────────┴──────────┴──────────┴─────────────┘
```

### 3D City

```
       📷────────🚦────────📷
                    🔴
                 Violation
```

### Recent Violations

```
KA01AB1234 │ RED LIGHT
KA05XY2345 │ OVERSPEED
KA03CD9988 │ WRONG SIDE
```

---

# 27. Analytics

## Dashboard Metrics

- Total violations
- Today's violations
- Most common violation
- Highest-risk CCTV
- Total fines
- Paid fines
- Pending fines

## Violation Distribution

```
Overspeeding    ███████████ 42%
Red Light       ███████     27%
Wrong Side      █████       18%
Helmet          ███         13%
```

## Hotspot Detection

Example:

```
CCTV-03 → 120 violations
CCTV-05 → 85 violations
CCTV-07 → 12 violations
```

System identifies:

```
CCTV-03
HIGH-RISK HOTSPOT
```

The same hotspot information can be displayed directly on the 3D map.

---

# 28. System Health

Admin should have a system-health section.

```
ML SERVICES

ANPR              🟢 ONLINE
Speed Detection   🟢 ONLINE
Helmet            🟢 ONLINE
Wrong Side        🟢 ONLINE
```

### CCTV Processing

```
CCTV-01   🟢 Processing
CCTV-02   🟢 Processing
CCTV-03   🟢 Processing
CCTV-04   ⚪ Stopped
```

---

# 29. Complete End-to-End Workflow

This is the **main workflow of the entire project**:

```
                         ADMIN
                           │
                           ▼
                  Configure CCTV
                           │
                           ▼
                Configure Traffic Lights
                           │
                           ▼
                    Upload Videos
                           │
                           ▼
                 Set Initial States
                           │
                           ▼
                  START SIMULATION
                           │
                           ▼
                ┌────────────────────┐
                │  VIDEO PROCESSING  │
                └─────────┬──────────┘
                          │
                          ▼
                    FastAPI ML
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
           Speed       Helmet         ANPR
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                   Detection Events
                          │
                          ▼
                   VIOLATION ENGINE
                          │
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
        Red Light     Overspeed      Wrong Side
             │            │             │
             └────────────┼─────────────┘
                          │
                          ▼
                     Vehicle DB
                          │
                          ▼
                  Vehicle + Owner
                          │
                          ▼
                    Fine Engine
                          │
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
          Evidence       Fine        Penalty PDF
             │            │             │
             └────────────┼─────────────┘
                          │
                          ▼
                     WhatsApp
                          │
                          ▼
                    CITIZEN PORTAL
                          │
                          ▼
                  View Violation
                          │
                          ▼
                  View Evidence
                          │
                          ▼
                 MARK PAYMENT DONE
                          │
                          ▼
                         PAID
```

# Smart Traffic System — High-Level Technical Plan

## 1. Final technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS | All user interfaces and dashboards |
| 3D map | OpenFreeMap, MapLibre GL JS | Map, camera placement, traffic lights, violation markers |
| 3D assets | Compatible 3D models | Visual representation of CCTV cameras and traffic lights |
| Main backend | Node.js, Express.js, TypeScript | APIs, authentication, business logic and orchestration |
| ML service | Python, FastAPI | Calling your friend's detection models |
| Database | PostgreSQL, Drizzle ORM | Users, vehicles, cameras, simulations, violations and fines |
| Object storage | Cloudflare R2 | CCTV videos, evidence images and penalty PDFs |
| WhatsApp | OpenWA | Sending notification messages and PDF documents |
| Real-time updates | Socket.IO or Server-Sent Events | Updating dashboards as simulations generate events |

| Module | Main responsibility |
| --- | --- |
| 1. Authentication & RBAC | Login, user roles and access control |
| 2. Camera & Traffic Light Management | Register map locations, speed limits and associations |
| 3. Simulation Manager | Upload configuration, synchronize video starts, start/stop and track simulation status |
| 4. Video Processing | Process uploaded video files in the background |
| 5. ML Integration | Send suitable video frames or clips to FastAPI and receive detection results |
| 6. Event & Violation Engine | Normalize detections, apply rules and prevent duplicate violations |
| 7. Vehicle Registry | Match detected plate numbers to registered owners |
| 8. Fine & Evidence Management | Generate fine records, capture evidence and create penalty PDFs |
| 9. Notification Service | Send WhatsApp messages and track delivery attempts |
| 10. Analytics & Live Updates | Display violations, hotspots, camera statuses and simulation activity |

## Main workflows

### A. Admin setup and simulation

```
Create CCTV and traffic lights on the map
                    ↓
Set camera speed limits and associations
                    ↓
Upload a video for each CCTV
                    ↓
Set initial traffic-light states
                    ↓
Validate configuration
                    ↓
         START SIMULATION
                    ↓
All video timelines start at t = 0
                    ↓
Background workers process videos
```

### Detection and enforcement

```
Video Worker
    ↓
FastAPI ML models
    ↓
Detection Events
    ↓
Violation Rules
    ↓
ANPR + Vehicle Registry
    ↓
Police Verification (where required)
    ↓
Violation + Evidence + Fine
    ↓
Penalty PDF
    ↓
WhatsApp Notification
```

### Citizen workflow

```
WhatsApp notification
        ↓
Citizen logs in
        ↓
Views violation and evidence
        ↓
Views fine details
        ↓
Clicks "Mark Payment Done"
        ↓
Payment status updated
```

#### Red-light jumping

The violation engine combines the traffic-light state, vehicle trajectory or stop-line crossing, speed/movement information and plate identity. A moving vehicle alone is not enough to establish a violation.

#### Average speed between two CCTVs

A road-segment module matches the same plate across a configured camera pair, calculates elapsed simulation time and estimates average speed using the segment distance. It then compares that estimate with the segment speed limit.

## Frontend route groups

| Route group | Main pages |
| --- | --- |
| Public / Auth | Login, registration |
| Citizen | Dashboard, vehicles, violations, violation details, fines, notifications |
| Police | Command center, CCTV monitoring, violation review, vehicle search, analytics |
| Admin | Overview, camera management, traffic-light management, vehicle registry, simulation setup, system health |