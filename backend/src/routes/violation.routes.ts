import { Router } from 'express';
import {
  getViolations,
  payFine,
  verifyViolationWithNano,
  verifyAllPendingWithNano,
} from '../controllers/violation.controller.js';

const router = Router();

router.get('/', getViolations);
router.post('/verify-all-nano', verifyAllPendingWithNano);
router.post('/:id/verify-nano', verifyViolationWithNano);
router.post('/:id/pay', payFine);
router.patch('/:id/pay', payFine);
router.post('/fines/:id/pay', payFine);
router.patch('/fines/:id/pay', payFine);

export default router;
