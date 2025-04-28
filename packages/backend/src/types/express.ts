// src/types/express.ts
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    sessionId?: string;
  }
  
  // Extend Express Request interface once
  declare global {
    namespace Express {
      interface Request {
        user?: TokenPayload;
      }
    }
  }