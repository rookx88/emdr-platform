// packages/backend/src/routes/clientRoutes.ts
import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { clientController } from '../controllers/clientController';

const router = express.Router();

// Get all clients (therapists and admins only)
router.get('/', authenticate, requireRole(['THERAPIST', 'ADMIN']), clientController.getClients);

// Get current user's client profile (client role only)
router.get('/me', authenticate, requireRole(['CLIENT']), clientController.getMyClientProfile);

// Get a specific client by ID
router.get('/:id', authenticate, clientController.getClientById);

// Create a new client (therapists and admins only)
router.post('/', authenticate, requireRole(['THERAPIST', 'ADMIN']), clientController.createClient);

// Update a client
router.put('/:id', authenticate, clientController.updateClient);

// Delete a client (admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), clientController.deleteClient);

// Restore a client (admin only)
router.post('/:id/restore', authenticate, requireRole(['ADMIN']), clientController.restoreClient);

// Assign therapist to client
router.post('/:clientId/assign-therapist', authenticate, requireRole(['THERAPIST', 'ADMIN']), clientController.assignTherapist);

export default router;