import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { cameras, trafficLights } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function getAllCameras(req: Request, res: Response): Promise<void> {
  try {
    const list = await db
      .select({
        id: cameras.id,
        name: cameras.name,
        latitude: cameras.latitude,
        longitude: cameras.longitude,
        speedLimit: cameras.speedLimit,
        trafficLightId: cameras.trafficLightId,
        status: cameras.status,
        createdAt: cameras.createdAt,
        updatedAt: cameras.updatedAt,
        trafficLightName: trafficLights.name,
      })
      .from(cameras)
      .leftJoin(trafficLights, eq(cameras.trafficLightId, trafficLights.id))
      .orderBy(desc(cameras.createdAt));

    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cameras',
      error: error.message,
    });
  }
}

export async function createCamera(req: Request, res: Response): Promise<void> {
  try {
    let { id, name, latitude, longitude, speedLimit, trafficLightId, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Camera name is required',
      });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        message: 'Valid latitude between -90 and 90 is required',
      });
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        message: 'Valid longitude between -180 and 180 is required',
      });
      return;
    }

    const parsedSpeedLimit = speedLimit ? parseInt(String(speedLimit), 10) : 50;
    if (isNaN(parsedSpeedLimit) || parsedSpeedLimit <= 0) {
      res.status(400).json({
        success: false,
        message: 'Speed limit must be a positive integer',
      });
      return;
    }

    let finalId: string;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalId = `CCTV-${randomSuffix}`;
    } else {
      finalId = id.trim();
    }

    // Check if ID already exists
    const existing = await db
      .select({ id: cameras.id })
      .from(cameras)
      .where(eq(cameras.id, finalId))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: `Camera with ID '${finalId}' already exists`,
      });
      return;
    }

    let resolvedTrafficLightId: string | null = null;
    if (trafficLightId && typeof trafficLightId === 'string' && trafficLightId.trim() !== '') {
      const searchTlId = trafficLightId.trim();
      const tl = await db
        .select({ id: trafficLights.id })
        .from(trafficLights)
        .where(eq(trafficLights.id, searchTlId))
        .limit(1);

      if (tl.length === 0) {
        res.status(400).json({
          success: false,
          message: `Connected traffic light with ID '${searchTlId}' does not exist`,
        });
        return;
      }
      resolvedTrafficLightId = searchTlId;
    }

    const validStatus = (['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const).includes(status)
      ? status
      : 'ACTIVE';

    const [inserted] = await db
      .insert(cameras)
      .values({
        id: finalId,
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        speedLimit: parsedSpeedLimit,
        trafficLightId: resolvedTrafficLightId,
        status: validStatus,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Camera created successfully',
      data: inserted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create camera',
      error: error.message,
    });
  }
}

export async function deleteCamera(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!id || id.trim() === '') {
      res.status(400).json({ success: false, message: 'Camera ID is required' });
      return;
    }

    const deleted = await db
      .delete(cameras)
      .where(eq(cameras.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({
        success: false,
        message: `Camera '${id}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Camera '${id}' deleted successfully`,
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete camera',
      error: error.message,
    });
  }
}
