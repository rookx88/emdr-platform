import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { insuranceController } from '../controllers/insuranceController';

const router = express.Router();

router.post('/verify/:clientId?', authenticate, requireRole(['THERAPIST', 'ADMIN']), insuranceController.verify);

export default router;
