import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { appointmentController } from '../controllers/appointmentController';

const router = express.Router();

// Basic appointment management
router.post('/', authenticate, appointmentController.createAppointment);
router.get('/', authenticate, appointmentController.getAppointments);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, appointmentController.updateAppointment);
router.delete('/:id', authenticate, appointmentController.cancelAppointment);

// Therapist-specific endpoints
router.get('/therapist/:therapistId', authenticate, appointmentController.getTherapistAppointments);

// Client-specific endpoints
router.get('/client/:clientId', authenticate, appointmentController.getClientAppointments);

// Calendar integration endpoints
router.post('/sync', authenticate, requireRole(['THERAPIST', 'ADMIN']), appointmentController.syncWithGoogleCalendar);
router.post('/connect-calendar', authenticate, requireRole(['THERAPIST', 'ADMIN']), appointmentController.connectGoogleCalendar);

export default router;