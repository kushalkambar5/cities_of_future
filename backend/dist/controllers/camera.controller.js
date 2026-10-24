"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCameras = getAllCameras;
exports.createCamera = createCamera;
exports.deleteCamera = deleteCamera;
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
async function getAllCameras(req, res) {
    try {
        const list = await index_js_1.db
            .select({
            id: schema_js_1.cameras.id,
            name: schema_js_1.cameras.name,
            latitude: schema_js_1.cameras.latitude,
            longitude: schema_js_1.cameras.longitude,
            speedLimit: schema_js_1.cameras.speedLimit,
            trafficLightId: schema_js_1.cameras.trafficLightId,
            status: schema_js_1.cameras.status,
            createdAt: schema_js_1.cameras.createdAt,
            updatedAt: schema_js_1.cameras.updatedAt,
            trafficLightName: schema_js_1.trafficLights.name,
        })
            .from(schema_js_1.cameras)
            .leftJoin(schema_js_1.trafficLights, (0, drizzle_orm_1.eq)(schema_js_1.cameras.trafficLightId, schema_js_1.trafficLights.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.cameras.createdAt));
        res.status(200).json({
            success: true,
            count: list.length,
            data: list,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cameras',
            error: error.message,
        });
    }
}
async function createCamera(req, res) {
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
        let finalId;
        if (!id || typeof id !== 'string' || id.trim() === '') {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            finalId = `CCTV-${randomSuffix}`;
        }
        else {
            finalId = id.trim();
        }
        // Check if ID already exists
        const existing = await index_js_1.db
            .select({ id: schema_js_1.cameras.id })
            .from(schema_js_1.cameras)
            .where((0, drizzle_orm_1.eq)(schema_js_1.cameras.id, finalId))
            .limit(1);
        if (existing.length > 0) {
            res.status(409).json({
                success: false,
                message: `Camera with ID '${finalId}' already exists`,
            });
            return;
        }
        let resolvedTrafficLightId = null;
        if (trafficLightId && typeof trafficLightId === 'string' && trafficLightId.trim() !== '') {
            const searchTlId = trafficLightId.trim();
            const tl = await index_js_1.db
                .select({ id: schema_js_1.trafficLights.id })
                .from(schema_js_1.trafficLights)
                .where((0, drizzle_orm_1.eq)(schema_js_1.trafficLights.id, searchTlId))
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
        const validStatus = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)
            ? status
            : 'ACTIVE';
        const [inserted] = await index_js_1.db
            .insert(schema_js_1.cameras)
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create camera',
            error: error.message,
        });
    }
}
async function deleteCamera(req, res) {
    try {
        const id = String(req.params.id);
        if (!id || id.trim() === '') {
            res.status(400).json({ success: false, message: 'Camera ID is required' });
            return;
        }
        const deleted = await index_js_1.db
            .delete(schema_js_1.cameras)
            .where((0, drizzle_orm_1.eq)(schema_js_1.cameras.id, id))
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete camera',
            error: error.message,
        });
    }
}
