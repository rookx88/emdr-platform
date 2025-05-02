import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { therapistController } from '../controllers/therapistController';

const router = express.Router();

// Get all therapists
router.get('/', authenticate, therapistController.getTherapists);

// Get available therapists for client selection
router.get('/available', authenticate, therapistController.getAvailableTherapists);

// Get current user's therapist profile
router.get('/me', authenticate, requireRole(['THERAPIST']), therapistController.getMyTherapistProfile);

// Get a specific therapist by ID
router.get('/:id', authenticate, therapistController.getTherapistById);

// Update therapist profile
router.put('/:id', authenticate, requireRole(['THERAPIST', 'ADMIN']), therapistController.updateTherapistProfile);

// Set therapist availability
router.post('/:therapistId/availability', authenticate, requireRole(['THERAPIST', 'ADMIN']), therapistController.setAvailability);

// Get therapist availability
router.get('/:therapistId/availability', authenticate, therapistController.getAvailability);

export default router;