import { Router } from 'express';
import {
  getSimulationCameras,
  assignCameraVideo,
  processSimulation,
  getDangerousVehicles,
} from '../controllers/simulation.controller.js';

const router = Router();

router.get('/cameras', getSimulationCameras);
router.post('/assign-video', assignCameraVideo);
router.post('/process', processSimulation);
router.get('/dangerous-vehicles', getDangerousVehicles);

export default router;
