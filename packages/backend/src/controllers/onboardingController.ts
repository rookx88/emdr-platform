import { Request, Response, NextFunction } from 'express';
import { onboardingService } from '../services/onboardingService';

export const onboardingController = {
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ message: 'token required' });
      const invitation = await onboardingService.verifyToken(token);
      if (!invitation) return res.status(404).json({ message: 'invalid token' });
      const therapist = invitation.user.clientProfile?.therapist?.user;
      res.json({
        userId: invitation.userId,
        therapistName: therapist ? `${therapist.firstName ?? ''} ${therapist.lastName ?? ''}`.trim() : null,
        therapistPhoto: null
      });
    } catch (err) {
      next(err);
    }
  },

  async requestMagicCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, email } = req.body;
      if (!token || !email) return res.status(400).json({ message: 'token and email required' });
      const code = await onboardingService.requestMagicCode(token, email);
      if (!code) return res.status(400).json({ message: 'cannot generate code' });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async verifyMagicCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, email, code } = req.body;
      if (!token || !email || !code) return res.status(400).json({ message: 'token, email and code required' });
      const user = await onboardingService.verifyMagicCode(token, email, code);
      if (!user) return res.status(400).json({ message: 'invalid code' });
      res.json({ success: true, userId: user.id });
    } catch (err) {
      next(err);
    }
  },

  async oauthComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, provider, providerId } = req.body;
      if (!token || !provider || !providerId) return res.status(400).json({ message: 'missing fields' });
      const user = await onboardingService.recordOAuth(token, provider, providerId);
      if (!user) return res.status(400).json({ message: 'invalid token' });
      res.json({ success: true, userId: user.id });
    } catch (err) {
      next(err);
    }
  },

  async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, stage } = req.body;
      if (!clientId || !stage) return res.status(400).json({ message: 'clientId and stage required' });
      const record = await onboardingService.updateOnboardingStage(clientId, stage);
      res.json(record);
    } catch (err) {
      next(err);
    }
  }
};
