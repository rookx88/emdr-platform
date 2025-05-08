// packages/backend/src/routes/phiRoutes.ts
import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { phiController } from '../controllers/phiController';

const router = express.Router();

// Viewing and processing PHI
router.get('/:token', authenticate, phiController.viewPHI);
router.post('/detokenize', authenticate, phiController.detokenizeText);
router.post('/tokenize', authenticate, phiController.tokenizeText);

// Security scanning (admin only)
router.post('/security-scan', authenticate, requireRole(['ADMIN']), phiController.runSecurityScan);
router.get('/security-scan/:scanId', authenticate, requireRole(['ADMIN']), phiController.getSecurityScanResults);
router.post('/security-scan/:scanId/fix', authenticate, requireRole(['ADMIN']), phiController.fixUnencryptedPHI);

export default router;