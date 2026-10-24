import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { trafficLights, cameras } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function getAllTrafficLights(req: Request, res: Response): Promise<void> {
  try {
    const list = await db
      .select()
      .from(trafficLights)
      .orderBy(desc(trafficLights.createdAt));

    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic lights',
      error: error.message,
    });
  }
}

export async function createTrafficLight(req: Request, res: Response): Promise<void> {
  try {
    let { id, name, latitude, longitude } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Traffic light name is required',
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

    let finalId: string;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalId = `TL-${randomSuffix}`;
    } else {
      finalId = id.trim();
    }

    // Check if ID already exists
    const existing = await db
      .select({ id: trafficLights.id })
      .from(trafficLights)
      .where(eq(trafficLights.id, finalId))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: `Traffic light with ID '${finalId}' already exists`,
      });
      return;
    }

    const [inserted] = await db
      .insert(trafficLights)
      .values({
        id: finalId,
        name: name.trim(),
        latitude: lat,
        longitude: lng,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Traffic light created successfully',
      data: inserted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create traffic light',
      error: error.message,
    });
  }
}

export async function deleteTrafficLight(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!id || id.trim() === '') {
      res.status(400).json({ success: false, message: 'Traffic light ID is required' });
      return;
    }

    // 1. Find and cascade delete any CCTV cameras connected to this traffic light
    const deletedCameras = await db
      .delete(cameras)
      .where(eq(cameras.trafficLightId, id))
      .returning();

    // 2. Delete the traffic light itself
    const deletedTL = await db
      .delete(trafficLights)
      .where(eq(trafficLights.id, id))
      .returning();

    if (deletedTL.length === 0) {
      res.status(404).json({
        success: false,
        message: `Traffic light '${id}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Traffic light '${id}' and ${deletedCameras.length} connected CCTV camera(s) deleted successfully`,
      data: {
        trafficLight: deletedTL[0],
        deletedCameras,
        deletedCameraIds: deletedCameras.map((c) => c.id),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete traffic light and connected cameras',
      error: error.message,
    });
  }
}
