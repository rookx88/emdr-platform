// src/types/express.ts
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export interface PHIContext {
  purpose: string;
  shouldDetokenize: boolean;
  actorId: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      phiContext?: PHIContext; // Add PHI context
    }
  }
}