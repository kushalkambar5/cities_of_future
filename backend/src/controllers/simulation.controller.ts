import { Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index.js';
import {
  videoFiles,
  cameras,
  simulations,
  vehicles,
  users,
  violations,
  fines,
  notifications,
} from '../db/schema.js';
import { getR2PublicUrl } from '../services/r2.service.js';
import { createAndUploadChallanPdf } from '../services/pdf.service.js';
import { sendWhatsAppMessage, sendWhatsAppDocument, sendWhatsAppVideo } from '../services/whatsapp.service.js';
import { verifyViolationWithNanoBanana } from '../services/nanoBanana.service.js';
import { config } from '../config/env.js';

/**
 * Default sample CCTV video paths available on the system
 */
const DEFAULT_CCTV_DIR = 'C:\\Users\\kusha\\Downloads\\dfhsd\\CCTV videos';
const DEFAULT_VIDEO_ASSIGNMENTS: Record<string, string> = {
  CAM_01: path.join(DEFAULT_CCTV_DIR, 'Helmet Detection (online-video-cutter.com).mp4'),
  CAM_02: path.join(DEFAULT_CCTV_DIR, 'Licence Plate Camera Illustration Video (online-video-cutter.com).mp4'),
  CAM_03: path.join(DEFAULT_CCTV_DIR, 'sample_cctv_traffic.mp4'),
};

/**
 * Ensures existing CCTV cameras exist in the database
 */
async function ensureCctvCameras(): Promise<void> {
  const existingCams = await db.select().from(cameras);
  const camIds = new Set(existingCams.map((c) => c.id));

  const defaults = [
    {
      id: 'CAM_01',
      name: 'Smart Junction Alpha CCTV (Helmet & Traffic)',
      latitude: 12.9716,
      longitude: 77.5946,
      speedLimit: 60,
      status: 'ACTIVE' as const,
    },
    {
      id: 'CAM_02',
      name: 'ANPR Surveillance Camera 02 (License Plate Cam)',
      latitude: 12.9734,
      longitude: 77.5982,
      speedLimit: 50,
      status: 'ACTIVE' as const,
    },
    {
      id: 'CAM_03',
      name: 'Central Express Highway CCTV 03 (Speed & Traffic)',
      latitude: 12.9789,
      longitude: 77.6015,
      speedLimit: 70,
      status: 'ACTIVE' as const,
    },
  ];

  for (const cam of defaults) {
    if (!camIds.has(cam.id)) {
      await db.insert(cameras).values(cam).onConflictDoNothing();
    }
  }

  let defaultSim = await db.query.simulations.findFirst();
  if (!defaultSim) {
    const adminUser = await db.query.users.findFirst({ where: eq(users.role, 'ADMIN') });
    await db.insert(simulations).values({
      name: 'Navanagar Multi-CCTV Traffic Simulation',
      status: 'READY',
      startedAt: new Date(),
      createdBy: adminUser ? adminUser.id : null,
    });
  }
}

/**
 * Get all CCTV cameras with their assigned video files
 */
export async function getSimulationCameras(req: Request, res: Response): Promise<void> {
  try {
    await ensureCctvCameras();

    const allCameras = await db.select().from(cameras).orderBy(cameras.id);
    const allVideos = await db.select().from(videoFiles).orderBy(desc(videoFiles.createdAt));

    // Map each camera with its latest assigned video file
    const enriched = allCameras.map((cam) => {
      const assigned = allVideos.find((v) => v.cameraId === cam.id);
      const defaultPath = DEFAULT_VIDEO_ASSIGNMENTS[cam.id] || '';
      return {
        ...cam,
        assignedVideo: assigned
          ? {
              id: assigned.id,
              fileName: assigned.fileName,
              filePath: assigned.r2Key,
              status: assigned.status,
              createdAt: assigned.createdAt,
            }
          : defaultPath && fs.existsSync(defaultPath)
          ? {
              id: 0,
              fileName: path.basename(defaultPath),
              filePath: defaultPath,
              status: 'READY',
            }
          : null,
        suggestedPath: defaultPath,
      };
    });

    res.status(200).json({ success: true, cameras: enriched });
  } catch (error: any) {
    console.error('Error in getSimulationCameras:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cameras' });
  }
}

/**
 * Assign a local video file path to a CCTV camera (no R2 upload required)
 */
export async function assignCameraVideo(req: Request, res: Response): Promise<void> {
  try {
    const { cameraId, filePath, fileName } = req.body;

    if (!cameraId || !filePath) {
      res.status(400).json({ error: 'Both cameraId and filePath are required' });
      return;
    }

    const cleanPath = String(filePath).trim().replace(/^["']|["']$/g, '');
    const actualFileName = fileName || path.basename(cleanPath) || 'cctv_footage.mp4';

    // Verify file exists on local system
    const exists = fs.existsSync(cleanPath);

    const sim = await db.query.simulations.findFirst();
    const simId = sim ? sim.id : 1;

    // Record or update in video_files table with local path stored
    const [record] = await db
      .insert(videoFiles)
      .values({
        cameraId,
        simulationId: simId,
        fileName: actualFileName,
        r2Key: cleanPath, // Stores local file path
        status: exists ? 'UPLOADED' : 'PENDING',
      })
      .returning();

    res.status(200).json({
      success: true,
      message: exists
        ? 'Local video file assigned to CCTV camera successfully'
        : 'File path assigned (Warning: file not found on disk at specified path)',
      existsOnDisk: exists,
      video: record,
    });
  } catch (error: any) {
    console.error('Error in assignCameraVideo:', error);
    res.status(500).json({ error: error.message || 'Failed to assign video to camera' });
  }
}

/**
 * Run Integrated Multi-Model Simulation on Video via FastAPI using local file path
 */
export async function processSimulation(req: Request, res: Response): Promise<void> {
  try {
    const { cameraId, filePath, speedLimit, expectedDirection, videoFileId } = req.body;

    let targetFilePath = filePath;
    let targetCamId = cameraId || 'CAM_01';

    if (videoFileId && !targetFilePath) {
      const rec = await db.query.videoFiles.findFirst({
        where: eq(videoFiles.id, parseInt(videoFileId, 10)),
      });
      if (rec) {
        targetFilePath = rec.r2Key;
        targetCamId = rec.cameraId || targetCamId;
      }
    }

    if (!targetFilePath) {
      // Fallback to default path for camera if none provided
      targetFilePath = DEFAULT_VIDEO_ASSIGNMENTS[targetCamId];
    }

    if (!targetFilePath) {
      res.status(400).json({ error: 'Missing required parameter: filePath or valid cameraId' });
      return;
    }

    const cleanPath = String(targetFilePath).trim().replace(/^["']|["']$/g, '');

    // Check camera speed limit from DB if not supplied
    let camSpeedLimit = speedLimit ? parseFloat(speedLimit) : 60.0;
    const camRecord = await db.query.cameras.findFirst({ where: eq(cameras.id, targetCamId) });
    if (camRecord && !speedLimit) {
      camSpeedLimit = camRecord.speedLimit || 60.0;
    }

    const sim = await db.query.simulations.findFirst();
    const effectiveSimId = sim ? sim.id : 1;

    // 1. Call FastAPI ML service: POST /pipeline/process with file_path
    const fastApiPayload = {
      file_path: cleanPath,
      camera_id: targetCamId,
      simulation_id: effectiveSimId,
      speed_limit_kmh: camSpeedLimit,
      expected_direction_deg: expectedDirection ? parseFloat(expectedDirection) : 90.0,
      output_r2_prefix: 'processed',
    };

    console.log(`[Simulation] Sending local file path to FastAPI at ${config.fastapi.url}/pipeline/process: '${cleanPath}'...`);

    const mlResponse = await fetch(`${config.fastapi.url}/pipeline/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fastApiPayload),
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      console.error(`[Simulation] FastAPI ML service failed (${mlResponse.status}):`, errText);
      res.status(502).json({
        error: `FastAPI ML detection service error: ${errText || `HTTP ${mlResponse.status}`}`,
      });
      return;
    }

    const mlResult: any = await mlResponse.json();

    // Resolve Cloudflare R2 processed video link
    const r2PublicBase = (config.r2.publicUrl || '').replace(/\/$/, '');
    let processedVideoUrl: string | null = null;
    if (mlResult.output_video_url && String(mlResult.output_video_url).startsWith('http')) {
      processedVideoUrl = mlResult.output_video_url;
    } else if (mlResult.output_video_r2_key) {
      processedVideoUrl = `${r2PublicBase}/${String(mlResult.output_video_r2_key).replace(/^\//, '')}`;
    }

    // 2. Process Violations, Fines, and WhatsApp notifications
    const vehiclesDetected = mlResult.vehicles || [];
    const generatedFines: any[] = [];

    const defaultCitizen = await db.query.users.findFirst({
      where: eq(users.role, 'CITIZEN'),
    });

    for (const v of vehiclesDetected) {
      const plate = (v.number_plate || '').trim().toUpperCase();
      const violationsList: string[] = v.violations || [];

      if (violationsList.length === 0) {
        continue;
      }

      // Find or create vehicle in registry
      let vehicle = await db.query.vehicles.findFirst({
        where: eq(vehicles.plateNumber, plate),
      });

      if (!vehicle) {
        const [newVeh] = await db
          .insert(vehicles)
          .values({
            plateNumber: plate,
            ownerId: defaultCitizen ? defaultCitizen.id : null,
            vehicleType: v.helmet_status !== 'unknown' ? 'MOTORCYCLE' : 'CAR',
          })
          .returning();
        vehicle = newVeh;
      }

      // Fetch owner details
      let owner: any = null;
      if (vehicle.ownerId) {
        owner = await db.query.users.findFirst({
          where: eq(users.id, vehicle.ownerId),
        });
      }

      // Map violation type and fine amount
      let vType: 'OVERSPEED' | 'NO_HELMET' | 'WRONG_SIDE' | 'RED_LIGHT' = 'OVERSPEED';
      let fineAmount = 1000;

      if (violationsList.includes('no_helmet')) {
        vType = 'NO_HELMET';
        fineAmount = 1000;
      } else if (violationsList.includes('wrong_side')) {
        vType = 'WRONG_SIDE';
        fineAmount = 5000;
      } else if (violationsList.includes('overspeed')) {
        vType = 'OVERSPEED';
        fineAmount = 2000;
      } else if (violationsList.includes('red_light')) {
        vType = 'RED_LIGHT';
        fineAmount = 1500;
      } else {
        vType = 'OVERSPEED';
        fineAmount = 1000;
      }

      // 1. Insert violation record with initial PENDING_VERIFICATION status
      const [newViolation] = await db
        .insert(violations)
        .values({
          simulationId: effectiveSimId,
          cameraId: targetCamId,
          vehicleId: vehicle.id,
          type: vType,
          status: 'PENDING_VERIFICATION',
          confidence: v.plate_confidence || 0.85,
          simulationTimeMs: v.first_seen_ms || 0,
          description: `Camera ${targetCamId} detected violation(s): ${violationsList.join(', ')}. Speed: ${v.speed_kmh ? `${v.speed_kmh} km/h` : 'N/A'}. Track #${v.track_id}`,
        })
        .returning();

      // 2. Perform independent AI Audit via Google Nano Banana
      let finalViolationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' = 'PENDING_VERIFICATION';
      let nanoAuditReason = '';
      try {
        const nanoVerdict = await verifyViolationWithNanoBanana({
          violationId: newViolation.id,
          violationType: vType,
          plateNumber: plate,
          cameraId: targetCamId,
          description: newViolation.description || '',
          speedKmh: v.speed_kmh,
          speedLimit: camSpeedLimit,
          confidence: v.plate_confidence || 0.85,
        });

        finalViolationStatus = nanoVerdict.verified ? 'VERIFIED' : 'REJECTED';
        nanoAuditReason = nanoVerdict.reason;

        await db
          .update(violations)
          .set({
            status: finalViolationStatus,
            description: `${newViolation.description} | [Google Nano Banana: ${finalViolationStatus} - ${nanoAuditReason}]`,
          })
          .where(eq(violations.id, newViolation.id));
      } catch (nanoErr: any) {
        console.error(`[Nano Banana] Verification error for violation #${newViolation.id}:`, nanoErr.message);
      }

      // If rejected by Google Nano Banana, do not issue fine or send WhatsApp notice
      if (finalViolationStatus === 'REJECTED') {
        console.log(`[Simulation] Violation #${newViolation.id} (${plate}) rejected as false positive by Google Nano Banana.`);
        continue;
      }

      // Insert fine record
      const [newFine] = await db
        .insert(fines)
        .values({
          violationId: newViolation.id,
          amount: fineAmount.toString(),
          status: 'UNPAID',
        })
        .returning();

      const challanNumber = `CHL-${new Date().getFullYear()}-${String(newViolation.id).padStart(5, '0')}`;

      // Generate & Upload E-Challan PDF to Cloudflare R2
      let pdfResult: any = null;
      try {
        pdfResult = await createAndUploadChallanPdf({
          challanNumber,
          violationId: newViolation.id,
          plateNumber: plate,
          vehicleType: vehicle.vehicleType,
          ownerName: owner?.name || 'Registered Vehicle Owner',
          ownerPhone: owner?.phone || 'N/A',
          violationType: vType,
          violationDescription: `Automated detection on ${targetCamId}: ${violationsList.join(', ')}`,
          fineAmount,
          cameraId: targetCamId,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        });

        await db
          .update(fines)
          .set({ pdfR2Key: pdfResult.key })
          .where(eq(fines.id, newFine.id));
      } catch (pdfErr: any) {
        console.error(`[PDF Error] Failed to generate/upload PDF for plate ${plate}:`, pdfErr.message);
      }

      // Send WhatsApp Notification via OpenWA
      let waTextStatus: any = { success: false, error: 'No phone' };
      let waDocStatus: any = { success: false, error: 'No phone' };
      let waVideoStatus: any = { success: false, error: 'No phone' };

      const ownerPhone = owner?.phone;
      if (ownerPhone) {
        const videoSection = processedVideoUrl
          ? `\n📹 *Violation Evidence Video (Cloudflare R2)*:\n${processedVideoUrl}\n`
          : '';

        const textMessage = `🚨 *NAVANAGAR SMART TRAFFIC ENFORCEMENT NOTICE* 🚨\n\nDear *${owner.name}*,\nAn automated traffic rule violation has been detected for your vehicle *${plate}* at *${targetCamId}*.\n\n• *Challan No*: ${challanNumber}\n• *Violation*: ${vType.replace(/_/g, ' ')}\n• *Fine Amount*: ₹${fineAmount}\n• *Status*: UNPAID\n• *Camera Sensor*: ${targetCamId}\n${videoSection}\nPlease find your official E-Challan PDF attached below. Pay online via the Navanagar Citizen Portal.`;

        // 1. Send Text Message with Cloudflare R2 video link
        waTextStatus = await sendWhatsAppMessage(ownerPhone, textMessage);

        // 2. Send Processed Video directly to WhatsApp
        if (processedVideoUrl) {
          try {
            waVideoStatus = await sendWhatsAppVideo(
              ownerPhone,
              { url: processedVideoUrl },
              `📹 Automated Traffic Violation Footage for ${plate} (${challanNumber})`
            );
          } catch (vidErr: any) {
            console.error(`[OpenWA] Video dispatch error for ${plate}:`, vidErr.message);
            waVideoStatus = { success: false, error: vidErr.message };
          }
        }

        // 3. Send PDF Document
        if (pdfResult?.publicUrl || pdfResult?.buffer) {
          waDocStatus = await sendWhatsAppDocument(
            ownerPhone,
            {
              url: pdfResult.publicUrl,
              base64: pdfResult.buffer ? pdfResult.buffer.toString('base64') : undefined,
            },
            `E-Challan_${plate}.pdf`,
            `Official E-Challan #${challanNumber} for ${plate}`
          );
        }

        // 4. Log notification in DB
        await db.insert(notifications).values({
          userId: owner.id,
          vehicleId: vehicle.id,
          violationId: newViolation.id,
          type: 'FINE_ISSUED',
          channel: 'WHATSAPP',
          status: waTextStatus.success || waDocStatus.success || waVideoStatus.success ? 'SENT' : 'FAILED',
          message: textMessage,
          r2Key: pdfResult?.key || null,
          sentAt: new Date(),
        });
      }

      generatedFines.push({
        challanNumber,
        violationId: newViolation.id,
        plateNumber: plate,
        ownerName: owner?.name || 'Unregistered Citizen',
        ownerPhone: ownerPhone || 'N/A',
        violationType: vType,
        fineAmount,
        pdfUrl: pdfResult?.publicUrl || null,
        pdfKey: pdfResult?.key || null,
        videoUrl: processedVideoUrl,
        whatsappStatus: {
          textMessage: waTextStatus,
          videoMessage: waVideoStatus,
          documentMessage: waDocStatus,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Simulation pipeline executed successfully for ${targetCamId}`,
      cameraId: targetCamId,
      mlOutput: {
        totalFrames: mlResult.total_frames_processed,
        durationSeconds: mlResult.duration_seconds,
        outputVideoR2Key: mlResult.output_video_r2_key,
        outputVideoUrl: mlResult.output_video_url,
        annotatedMediaUrl: mlResult.annotated_media_url,
        accidentOverall: mlResult.accident_overall,
        totalVehiclesDetected: vehiclesDetected.length,
        vehicles: vehiclesDetected,
        detectedTimestamps: mlResult.detected_timestamps,
      },
      enforcement: {
        totalViolations: generatedFines.length,
        fines: generatedFines,
      },
    });
  } catch (error: any) {
    console.error('Error in processSimulation:', error);
    res.status(500).json({ error: error.message || 'Pipeline simulation failed' });
  }
}
