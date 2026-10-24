import { Router } from 'express';
import authRoutes from './auth.routes.js';
import trafficLightRoutes from './traffic-light.routes.js';
import cameraRoutes from './camera.routes.js';
import simulationRoutes from './simulation.routes.js';
import violationRoutes from './violation.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/traffic-lights', trafficLightRoutes);
router.use('/cameras', cameraRoutes);
router.use('/simulation', simulationRoutes);
router.use('/simulate', simulationRoutes);
router.use('/violations', violationRoutes);
router.use('/fines', violationRoutes);
router.use('/chat', chatRoutes);

// Healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Navanagar Smart Traffic API',
  });
});

export default router;
