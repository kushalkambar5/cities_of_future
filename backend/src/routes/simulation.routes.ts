import { Router } from 'express';
import {
  getSimulationCameras,
  assignCameraVideo,
  processSimulation,
} from '../controllers/simulation.controller.js';

const router = Router();

router.get('/cameras', getSimulationCameras);
router.post('/assign-video', assignCameraVideo);
router.post('/process', processSimulation);

export default router;
