import math
from collections import deque
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple

TRAJ_WINDOW = 60
LANE_CHANGE_MIN_LATERAL_MPS = 1.5
ZIGZAG_WINDOW = 30.0
ZIGZAG_MIN_REVERSALS = 4
BRAKE_THRESH_MPS2 = -3.0
ACCEL_THRESH_MPS2 = 3.0
TAILGATE_TIME_HEADWAY_S = 0.8
SHOULDER_MIN_DURATION_S = 1.5
UTURN_MIN_HEADING_DELTA_DEG = 150.0
UTURN_MAX_DURATION_S = 5.0

VIOLATION_WEIGHTS: Dict[str, float] = {
    "wrong_side": 10.0,
    "illegal_u_turn": 8.0,
    "aggressive_overtake": 7.0,
    "zigzag": 6.0,
    "dangerous_merge": 6.0,
    "tailgating": 5.0,
    "shoulder_driving": 5.0,
    "sudden_brake": 4.0,
    "sudden_lane_change": 3.0,
    "sudden_accel": 3.0,
    "no_helmet": 6.0,
    "no_seatbelt": 5.0,
    "overspeed": 8.0,
    "accident": 15.0,
}


@dataclass
class TrajPoint:
    """A single spatial-temporal sample along a vehicle trajectory."""
    ts: float                           # Timestamp in seconds
    pos: Tuple[float, float]            # (world_x, world_y) in meters
    speed: float                        # Speed in m/s
    heading: float                      # Direction angle in radians
    lane_id: int = 0
    on_shoulder: bool = False
    wrong_side: bool = False
    designated_uturn_zone: bool = False


@dataclass
class Violation:
    """A detected driving violation or hazard."""
    vtype: str
    ts: float
    severity: float = 1.0
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VehicleTrajectory:
    """Maintains a rolling window of spatial-temporal points for a vehicle track."""
    vehicle_id: int
    plate_number: str = "UNKNOWN"
    buffer: deque = field(default_factory=lambda: deque(maxlen=TRAJ_WINDOW))
    last_violation_ts: Dict[str, float] = field(default_factory=dict)

    def add(self, point: TrajPoint) -> None:
        self.buffer.append(point)

    def should_log(self, vtype: str, ts: float, interval: float = 2.0) -> bool:
        """Deduplicate consecutive identical violations within a cooldown interval."""
        if ts - self.last_violation_ts.get(vtype, -1e9) >= interval:
            self.last_violation_ts[vtype] = ts
            return True
        return False


def lateral_speed(a: TrajPoint, b: TrajPoint) -> float:
    """Calculate lateral velocity perpendicular to vehicle heading."""
    dt = b.ts - a.ts
    if dt <= 1e-6:
        return 0.0
    dx = b.pos[0] - a.pos[0]
    dy = b.pos[1] - a.pos[1]
    return (- (dx * math.sin(a.heading)) + (dy * math.cos(a.heading))) / dt


def assess_dangers(traj: VehicleTrajectory) -> List[Violation]:
    """Examine trajectory buffer and flag aggressive or hazardous driving behaviors."""
    b = traj.buffer
    violations: List[Violation] = []

    if len(b) >= 2:
        a, p = b[-2], b[-1]
        lat = abs(lateral_speed(a, p))
        if a.lane_id != p.lane_id and lat >= LANE_CHANGE_MIN_LATERAL_MPS:
            violations.append(Violation(
                vtype="sudden_lane_change",
                ts=p.ts,
                severity=min(lat / LANE_CHANGE_MIN_LATERAL_MPS, 3.0),
                details={"lateral_speed_mps": round(lat, 2)},
            ))

        dt = p.ts - a.ts
        accel = (p.speed - a.speed) / dt if dt > 1e-6 else 0.0
        if accel <= BRAKE_THRESH_MPS2:
            violations.append(Violation(
                vtype="sudden_brake",
                ts=p.ts,
                severity=min(abs(accel / BRAKE_THRESH_MPS2), 3.0),
                details={"accel_mps2": round(accel, 2)},
            ))
        elif accel >= ACCEL_THRESH_MPS2:
            violations.append(Violation(
                vtype="sudden_accel",
                ts=p.ts,
                severity=min(accel / ACCEL_THRESH_MPS2, 3.0),
                details={"accel_mps2": round(accel, 2)},
            ))

    if b and b[-1].wrong_side:
        violations.append(Violation(
            vtype="wrong_side",
            ts=b[-1].ts,
            severity=1.0,
            details={"lane_id": b[-1].lane_id, "speed_mps": round(b[-1].speed, 2)},
        ))

    if len(b) >= 5:
        now = b[-1].ts
        window = [p for p in b if now - p.ts <= ZIGZAG_WINDOW]
        if len(window) >= 2:
            ls = [lateral_speed(window[i], window[i + 1]) for i in range(len(window) - 1)]
            rev = sum(ls[i] * ls[i - 1] < -0.05 for i in range(1, len(ls)))
            if rev >= ZIGZAG_MIN_REVERSALS:
                violations.append(Violation(
                    vtype="zigzag",
                    ts=now,
                    severity=min(rev / ZIGZAG_MIN_REVERSALS, 3.0),
                    details={"reversal_count": rev},
                ))

    if b:
        now = b[-1].ts
        shoulder_points = [p for p in b if now - p.ts <= SHOULDER_MIN_DURATION_S]
        if len(shoulder_points) >= 3 and all(p.on_shoulder for p in shoulder_points):
            violations.append(Violation(
                vtype="shoulder_driving",
                ts=now,
                severity=1.0,
                details={},
            ))

    if len(b) >= 2:
        now = b[-1].ts
        uturn_window = [p for p in b if now - p.ts <= UTURN_MAX_DURATION_S]
        if len(uturn_window) >= 2:
            delta_deg = abs(math.degrees(uturn_window[-1].heading - uturn_window[0].heading)) % 360
            delta_deg = min(delta_deg, 360 - delta_deg)
            if delta_deg >= UTURN_MIN_HEADING_DELTA_DEG and not uturn_window[-1].designated_uturn_zone:
                violations.append(Violation(
                    vtype="illegal_u_turn",
                    ts=b[-1].ts,
                    severity=min(delta_deg / 180.0, 2.0),
                    details={"heading_delta_deg": round(delta_deg, 1)},
                ))

    return [v for v in violations if traj.should_log(v.vtype, v.ts)]


def session_score(violations: List[Violation]) -> float:
    """Calculate a driving safety score from 0 (poor) to 100 (perfect)."""
    penalty = sum(VIOLATION_WEIGHTS.get(v.vtype, 5.0) * v.severity for v in violations)
    return max(0.0, round(100.0 - penalty, 2))


def driving_score(violations: List[Violation], max_speed_kmh: float = 0.0, speed_limit_kmh: float = 60.0) -> float:
    """Return a 0-100 danger score: 0 is completely safe and 100 is most dangerous."""
    penalty = sum(VIOLATION_WEIGHTS.get(v.vtype, 5.0) * max(1.0, v.severity) for v in violations)
    if max_speed_kmh > speed_limit_kmh:
        excess_ratio = (max_speed_kmh - speed_limit_kmh) / max(speed_limit_kmh, 1.0)
        penalty += min(30.0, 20.0 * excess_ratio + 5.0)
    return min(100.0, round(penalty, 1))
