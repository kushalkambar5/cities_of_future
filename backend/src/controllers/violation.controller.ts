import { Request, Response } from 'express';
import { pool } from '../db/index.js';
import { verifyToken } from '../utils/jwt.utils.js';
import { getR2PublicUrl } from '../services/r2.service.js';
import { config } from '../config/env.js';
import {
  verifyViolationWithNanoBanana,
  auditViolationWithNanoBanana,
} from '../services/nanoBanana.service.js';

/**
 * Extract authenticated user if Bearer token present
 */
function extractAuthUser(req: Request): any | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      return verifyToken(token);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * GET /api/violations
 * Returns violation and fine records.
 * If user is a CITIZEN, or ?userId=X is provided, filters strictly to that user's vehicles/violations.
 * If user is ADMIN or POLICE, returns all violations with related user details.
 */
export async function getViolations(req: Request, res: Response): Promise<void> {
  try {
    const authUser = extractAuthUser(req);
    const queryUserId = req.query.userId ? parseInt(String(req.query.userId), 10) : undefined;
    const fineStatus = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const violationStatus = req.query.violationStatus
      ? String(req.query.violationStatus).toUpperCase()
      : undefined;
    const violationType = req.query.type ? String(req.query.type).toUpperCase() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    // Determine target user filter
    let filterUserId: number | undefined = undefined;

    if (authUser && authUser.role === 'CITIZEN') {
      filterUserId = authUser.userId;
    } else if (queryUserId && !isNaN(queryUserId)) {
      filterUserId = queryUserId;
    }

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let pIdx = 1;

    if (filterUserId !== undefined) {
      conditions.push(`u.id = $${pIdx++}`);
      params.push(filterUserId);
    }

    if (fineStatus && ['UNPAID', 'PAID', 'CANCELLED'].includes(fineStatus)) {
      conditions.push(`f.status = $${pIdx++}`);
      params.push(fineStatus);
    }

    if (
      violationStatus &&
      ['DETECTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'FINE_ISSUED'].includes(
        violationStatus
      )
    ) {
      conditions.push(`v.status = $${pIdx++}`);
      params.push(violationStatus);
    }

    if (violationType) {
      conditions.push(`v.type = $${pIdx++}`);
      params.push(violationType);
    }

    if (search) {
      conditions.push(
        `(veh.plate_number ILIKE $${pIdx} OR u.name ILIKE $${pIdx} OR u.phone ILIKE $${pIdx} OR u.email ILIKE $${pIdx} OR v.description ILIKE $${pIdx} OR v.camera_id ILIKE $${pIdx})`
      );
      params.push(`%${search}%`);
      pIdx++;
    }

    const sqlQuery = `
      SELECT 
        v.id AS violation_id,
        v.type AS violation_type,
        v.status AS violation_status,
        v.simulation_time_ms,
        v.confidence,
        v.description,
        v.created_at AS violation_created_at,
        cam.id AS camera_id,
        cam.name AS camera_name,
        cam.speed_limit AS camera_speed_limit,
        veh.id AS vehicle_id,
        veh.plate_number,
        veh.vehicle_type,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.role AS user_role,
        f.id AS fine_id,
        f.amount AS fine_amount,
        f.status AS fine_status,
        f.pdf_r2_key,
        f.issued_at AS fine_issued_at,
        f.paid_at AS fine_paid_at,
        ev.r2_key AS evidence_r2_key,
        n.status AS notification_status,
        n.sent_at AS notification_sent_at,
        n.message AS notification_message
      FROM violations v
      LEFT JOIN fines f ON f.violation_id = v.id
      LEFT JOIN vehicles veh ON veh.id = v.vehicle_id
      LEFT JOIN users u ON u.id = veh.owner_id
      LEFT JOIN cameras cam ON cam.id = v.camera_id
      LEFT JOIN LATERAL (
        SELECT r2_key FROM evidence WHERE violation_id = v.id ORDER BY id DESC LIMIT 1
      ) ev ON true
      LEFT JOIN LATERAL (
        SELECT status, sent_at, message FROM notifications WHERE violation_id = v.id ORDER BY id DESC LIMIT 1
      ) n ON true
      WHERE ${conditions.join(' AND ')}
      ORDER BY v.id DESC
    `;

    const result = await pool.query(sqlQuery, params);
    const rows = result.rows || [];

    const formatted = rows.map((r: any) => {
      const challanNumber = `CHL-2026-${String(r.violation_id).padStart(5, '0')}`;

      // Extract Cloudflare R2 video link
      let videoUrl: string | null = null;
      if (r.evidence_r2_key) {
        videoUrl = getR2PublicUrl(r.evidence_r2_key);
      } else if (r.notification_message) {
        const match = r.notification_message.match(/https?:\/\/[^\s\n]+\.mp4[^\s\n]*/i);
        if (match) {
          videoUrl = match[0];
        }
      }

      const pdfUrl = r.pdf_r2_key ? getR2PublicUrl(r.pdf_r2_key) : null;

      // Parse Nano Banana verification info from description if available
      const nanoMatch = r.description ? r.description.match(/\[Google Nano Banana: ([^\]]+)\]/i) : null;
      const nanoDetails = nanoMatch ? nanoMatch[1] : null;

      return {
        id: r.violation_id,
        challanNumber,
        violationType: r.violation_type,
        violationStatus: r.violation_status,
        nanoAuditReason: nanoDetails,
        description: r.description,
        confidence: r.confidence ? parseFloat(r.confidence) : 0.85,
        simulationTimeMs: r.simulation_time_ms ? Number(r.simulation_time_ms) : 0,
        createdAt: r.violation_created_at,
        camera: {
          id: r.camera_id,
          name: r.camera_name || r.camera_id,
          speedLimit: r.camera_speed_limit || 60,
        },
        vehicle: {
          id: r.vehicle_id,
          plateNumber: r.plate_number || 'UNKNOWN',
          vehicleType: r.vehicle_type || 'CAR',
        },
        owner: {
          id: r.user_id,
          name: r.user_name || 'Unregistered Citizen',
          email: r.user_email || 'N/A',
          phone: r.user_phone || 'N/A',
          role: r.user_role || 'CITIZEN',
        },
        fine: r.fine_id
          ? {
              id: r.fine_id,
              amount: parseFloat(r.fine_amount || '0'),
              status: r.fine_status || 'UNPAID',
              pdfR2Key: r.pdf_r2_key,
              pdfUrl,
              issuedAt: r.fine_issued_at,
              paidAt: r.fine_paid_at,
            }
          : null,
        evidence: {
          videoR2Key: r.evidence_r2_key || null,
          videoUrl,
        },
        notification: {
          status: r.notification_status || 'PENDING',
          sentAt: r.notification_sent_at || null,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      violations: formatted,
    });
  } catch (err: any) {
    console.error('[Violations Controller] Error fetching violations:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve traffic violations and fines',
      error: err.message,
    });
  }
}

/**
 * POST /api/violations/:id/verify-nano
 * Triggers Google Nano Banana AI verification for a specific violation.
 * Sets status to 'VERIFIED' or 'REJECTED'.
 */
export async function verifyViolationWithNano(req: Request, res: Response): Promise<void> {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const violationId = parseInt(rawId, 10);
    if (isNaN(violationId)) {
      res.status(400).json({ success: false, message: 'Invalid violation ID' });
      return;
    }

    const auditRes = await auditViolationWithNanoBanana(violationId);
    res.status(200).json({
      success: true,
      message: `Violation #${violationId} audited by Google Nano Banana: ${auditRes.status}`,
      violationId,
      status: auditRes.status,
      audit: auditRes.audit,
    });
  } catch (err: any) {
    console.error('[Nano Banana Audit] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to audit violation', error: err.message });
  }
}

/**
 * POST /api/violations/verify-all-nano
 * Audits all PENDING_VERIFICATION violations using Google Nano Banana.
 */
export async function verifyAllPendingWithNano(req: Request, res: Response): Promise<void> {
  try {
    const pendingRes = await pool.query(
      "SELECT id FROM violations WHERE status = 'PENDING_VERIFICATION' ORDER BY id ASC"
    );
    const pendingIds: number[] = (pendingRes.rows || []).map((r: any) => r.id);

    console.log(`[Nano Banana] Batch auditing ${pendingIds.length} pending violations...`);

    const results: any[] = [];
    for (const id of pendingIds) {
      try {
        const audit = await auditViolationWithNanoBanana(id);
        results.push(audit);
      } catch (e: any) {
        results.push({ violationId: id, success: false, error: e.message });
      }
    }

    const verifiedCount = results.filter((r) => r.status === 'VERIFIED').length;
    const rejectedCount = results.filter((r) => r.status === 'REJECTED').length;

    res.status(200).json({
      success: true,
      message: `Audited ${results.length} violations: ${verifiedCount} VERIFIED, ${rejectedCount} REJECTED by Google Nano Banana.`,
      total: results.length,
      verifiedCount,
      rejectedCount,
      results,
    });
  } catch (err: any) {
    console.error('[Nano Banana Batch Audit] Error:', err);
    res.status(500).json({ success: false, message: 'Batch audit failed', error: err.message });
  }
}

/**
 * POST /api/fines/:id/pay
 * When citizen pays their fine, the violation status becomes "FINE_ISSUED"
 * as explicitly requested: "When they click that, the status should become 'fine issued.'"
 */
export async function payFine(req: Request, res: Response): Promise<void> {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const fineId = parseInt(rawId, 10);
    if (isNaN(fineId)) {
      res.status(400).json({ success: false, message: 'Invalid fine ID' });
      return;
    }

    const authUser = extractAuthUser(req);

    // Verify fine exists
    const checkQuery = `
      SELECT f.id, f.status, f.amount, f.violation_id, v.status AS violation_status, veh.owner_id
      FROM fines f
      JOIN violations v ON v.id = f.violation_id
      LEFT JOIN vehicles veh ON veh.id = v.vehicle_id
      WHERE f.id = $1
    `;
    const checkRes = await pool.query(checkQuery, [fineId]);
    const fineRow: any = checkRes.rows?.[0];

    if (!fineRow) {
      res.status(404).json({ success: false, message: 'Fine not found' });
      return;
    }

    // If authenticated citizen, verify ownership
    if (authUser && authUser.role === 'CITIZEN' && fineRow.owner_id && fineRow.owner_id !== authUser.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized to pay fine for another user' });
      return;
    }

    // Only allow paying if the violation has been approved by Nano Banana (status: VERIFIED or FINE_ISSUED)
    if (fineRow.violation_status === 'PENDING_VERIFICATION') {
      res.status(400).json({
        success: false,
        message: 'This violation is currently PENDING_VERIFICATION by Google Nano Banana. Payment is unlocked only after AI audit verification.',
      });
      return;
    }

    const now = new Date();
    // 1. Mark fine as PAID
    await pool.query('UPDATE fines SET status = $1, paid_at = $2, updated_at = $2 WHERE id = $3', [
      'PAID',
      now,
      fineId,
    ]);

    // 2. Change violation status to "FINE_ISSUED" upon user clicking pay
    await pool.query("UPDATE violations SET status = 'FINE_ISSUED' WHERE id = $1", [fineRow.violation_id]);

    res.status(200).json({
      success: true,
      message: 'Fine paid successfully! Violation status updated to FINE_ISSUED.',
      fine: {
        id: fineId,
        status: 'PAID',
        paidAt: now.toISOString(),
      },
      violation: {
        id: fineRow.violation_id,
        status: 'FINE_ISSUED',
      },
    });
  } catch (err: any) {
    console.error('[Fine Payment] Error paying fine:', err);
    res.status(500).json({ success: false, message: 'Failed to process payment', error: err.message });
  }
}
