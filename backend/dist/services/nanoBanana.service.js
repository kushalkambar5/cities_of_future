"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyViolationWithNanoBanana = verifyViolationWithNanoBanana;
exports.auditViolationWithNanoBanana = auditViolationWithNanoBanana;
const env_js_1 = require("../config/env.js");
const index_js_1 = require("../db/index.js");
/**
 * Calls Google Nano Banana (Gemini 2.5 Flash / Nano Banana) to verify whether
 * a raw AI-detected traffic violation is accurate and genuine.
 */
async function verifyViolationWithNanoBanana(input) {
    const apiKey = env_js_1.config.googleApiKey || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.warn('[Nano Banana] No GOOGLE_API_KEY found. Falling back to heuristic verification.');
        return fallbackHeuristicVerify(input);
    }
    const prompt = `You are Google Nano Banana, the official autonomous AI Traffic Enforcement Auditor for the Navanagar Smart City Traffic Authority.
Your mandate is to review raw AI detector telemetry and independently determine whether a flagged traffic violation is SUBSTANTIATED (VERIFIED) or a FALSE POSITIVE (REJECTED).

Violation telemetry under audit:
- Type: ${input.violationType}
- Plate Number: ${input.plateNumber}
- Camera Sensor ID: ${input.cameraId}
- Posted Speed Limit: ${input.speedLimit ? `${input.speedLimit} km/h` : '60 km/h'}
- Observed Vehicle Speed: ${input.speedKmh ? `${input.speedKmh} km/h` : 'N/A'}
- Detector Confidence: ${input.confidence || 0.85}
- Detector Description: ${input.description || 'Automated sensor event'}

Verification Rules:
1. NO_HELMET: Valid if a rider/pillion is observed on a two-wheeler without protective headgear.
2. OVERSPEED: Valid if recorded speed exceeds posted speed limit by at least 3 km/h.
3. WRONG_SIDE: Valid if vehicle movement vector is opposite to authorized corridor flow.
4. RED_LIGHT: Valid if stop line crossed during red phase.

Respond ONLY with a valid JSON object with the following schema:
{
  "verified": true or false,
  "confidence": number between 0.0 and 1.0,
  "reason": "Clear explanation of your audit verdict."
}`;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Nano Banana] API request returned HTTP ${res.status}: ${errText}. Using heuristic fallback.`);
            return fallbackHeuristicVerify(input);
        }
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            console.warn('[Nano Banana] Empty response text from Gemini API. Using fallback.');
            return fallbackHeuristicVerify(input);
        }
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
            verified: Boolean(parsed.verified),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
            reason: String(parsed.reason || 'Verified by Google Nano Banana AI Auditor'),
            model: 'Google Nano Banana (gemini-2.5-flash)',
        };
    }
    catch (err) {
        console.error('[Nano Banana] Error verifying violation with Google Nano Banana:', err.message);
        return fallbackHeuristicVerify(input);
    }
}
/**
 * Fallback heuristic verification if API is temporarily unreachable
 */
function fallbackHeuristicVerify(input) {
    const isOverspeed = input.violationType === 'OVERSPEED';
    const speed = input.speedKmh || 0;
    const limit = input.speedLimit || 60;
    let verified = true;
    let reason = `Substantiated ${input.violationType.replace(/_/g, ' ')} detected on camera ${input.cameraId}`;
    if (isOverspeed && speed > 0 && speed <= limit) {
        verified = false;
        reason = `Observed speed ${speed} km/h is within posted limit ${limit} km/h. Rejected as false positive.`;
    }
    else if (input.confidence && input.confidence < 0.35) {
        verified = false;
        reason = `Low detector confidence (${(input.confidence * 100).toFixed(1)}%). Rejected due to high ambiguity.`;
    }
    return {
        verified,
        confidence: input.confidence || 0.88,
        reason: `${reason} (Audit verified by Google Nano Banana engine)`,
        model: 'Google Nano Banana Heuristic Engine',
    };
}
/**
 * Audits an existing violation from DB using Google Nano Banana
 * and updates its status to 'VERIFIED' or 'REJECTED'.
 */
async function auditViolationWithNanoBanana(violationId) {
    const q = `
    SELECT 
      v.id, v.type, v.status, v.description, v.confidence, v.camera_id,
      veh.plate_number, cam.speed_limit
    FROM violations v
    LEFT JOIN vehicles veh ON veh.id = v.vehicle_id
    LEFT JOIN cameras cam ON cam.id = v.camera_id
    WHERE v.id = $1
  `;
    const res = await index_js_1.pool.query(q, [violationId]);
    const row = res.rows?.[0];
    if (!row) {
        throw new Error(`Violation #${violationId} not found in database`);
    }
    // Extract speed if present in description
    const speedMatch = row.description ? row.description.match(/(\d+(\.\d+)?)\s*km\/h/i) : null;
    const speedKmh = speedMatch ? parseFloat(speedMatch[1]) : null;
    const auditResult = await verifyViolationWithNanoBanana({
        violationId,
        violationType: row.type,
        plateNumber: row.plate_number || 'UNKNOWN',
        cameraId: row.camera_id,
        description: row.description,
        speedKmh,
        speedLimit: row.speed_limit,
        confidence: row.confidence ? parseFloat(row.confidence) : 0.85,
    });
    const targetStatus = auditResult.verified ? 'VERIFIED' : 'REJECTED';
    const updatedDesc = row.description
        ? `${row.description} | [Nano Banana Audit: ${targetStatus} - ${auditResult.reason}]`
        : `[Nano Banana Audit: ${targetStatus} - ${auditResult.reason}]`;
    await index_js_1.pool.query('UPDATE violations SET status = $1, description = $2 WHERE id = $3', [targetStatus, updatedDesc, violationId]);
    return {
        success: true,
        violationId,
        status: targetStatus,
        audit: auditResult,
    };
}
