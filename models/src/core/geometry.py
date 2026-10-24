from typing import Dict, Optional, Tuple

BoxType = Tuple[int, int, int, int]  # (x1, y1, x2, y2)
PointType = Tuple[float, float]      # (x, y)


def center_of_box(box: BoxType) -> PointType:
    """Return the center point (cx, cy) of a bounding box."""
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def intersection_over_union(box_a: BoxType, box_b: BoxType) -> float:
    """Calculate the Intersection over Union (IoU) of two bounding boxes."""
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)

    inter_w = max(0, ix2 - ix1)
    inter_h = max(0, iy2 - iy1)
    inter_area = inter_w * inter_h
    if inter_area == 0:
        return 0.0

    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    union_area = area_a + area_b - inter_area
    return float(inter_area) / max(union_area, 1e-6)


def point_inside_box(point: PointType, box: BoxType) -> bool:
    """Check if a 2D point lies strictly within the bounding box."""
    px, py = point
    x1, y1, x2, y2 = box
    return x1 <= px <= x2 and y1 <= py <= y2


def associate_detection_to_vehicles(
    detection_box: BoxType,
    vehicles: Dict[int, BoxType],
    upper_only: bool = False,
    min_score_threshold: float = 0.05,
) -> Optional[int]:
    """Associate a sub-detection (e.g. helmet, plate, seatbelt) to the best matching vehicle track ID.
    
    Args:
        detection_box: Bounding box of the detected object (x1, y1, x2, y2)
        vehicles: Dictionary mapping vehicle track_id -> vehicle bounding box
        upper_only: If True (e.g. for helmets on riders), restricts matching to the upper 60% of the vehicle box
        min_score_threshold: Minimum match score required to assign association
        
    Returns:
        Best matching vehicle track_id, or None if no vehicle qualifies.
    """
    best_id: Optional[int] = None
    best_score: float = 0.0
    dcx, dcy = center_of_box(detection_box)

    for track_id, vehicle_box in vehicles.items():
        if upper_only:
            v_height = vehicle_box[3] - vehicle_box[1]
            if dcy > vehicle_box[1] + (v_height * 0.60):
                continue

        iou = intersection_over_union(detection_box, vehicle_box)
        contains_center = 0.65 if point_inside_box((dcx, dcy), vehicle_box) else 0.0
        score = iou + contains_center

        if score > best_score:
            best_id, best_score = track_id, score

    return best_id if best_score > min_score_threshold else None
