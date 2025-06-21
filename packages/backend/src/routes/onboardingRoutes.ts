import express from 'express';
import { onboardingController } from '../controllers/onboardingController';

const router = express.Router();

router.get('/verify', onboardingController.verifyToken);
router.post('/magic/send', onboardingController.requestMagicCode);
router.post('/magic/verify', onboardingController.verifyMagicCode);
router.post('/oauth', onboardingController.oauthComplete);
router.post('/stage', onboardingController.updateStage);

export default router;
