import { Router } from 'express';
import {
  getAllCameras,
  createCamera,
  deleteCamera,
} from '../controllers/camera.controller.js';

const router = Router();

router.get('/', getAllCameras);
router.post('/', createCamera);
router.delete('/:id', deleteCamera);

export default router;
