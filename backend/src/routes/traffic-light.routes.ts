import { Router } from 'express';
import {
  getAllTrafficLights,
  createTrafficLight,
  deleteTrafficLight,
} from '../controllers/traffic-light.controller.js';

const router = Router();

router.get('/', getAllTrafficLights);
router.post('/', createTrafficLight);
router.delete('/:id', deleteTrafficLight);

export default router;
