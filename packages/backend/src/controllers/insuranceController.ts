import { Request, Response, NextFunction } from 'express';
import { insuranceVerificationService } from '../services/insuranceVerificationService';

export const insuranceController = {
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = req.params.clientId || req.body.clientId;
      if (!clientId) {
        return res.status(400).json({ message: 'clientId is required' });
      }
      const info = req.body;
      const result = await insuranceVerificationService.verify(clientId, req.user!.userId, info);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
