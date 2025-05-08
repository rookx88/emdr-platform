// packages/backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';
import { PrismaClient } from '@prisma/client';
import { TokenPayload, PHIContext } from '../types/express';

// Ensure we're using a fresh instance of the Prisma client with all models
const prisma = new PrismaClient();

// Session timeout in minutes - defaults to 30 mins of inactivity
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '30', 10);

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in cookie first (more secure), then fall back to Authorization header
    let token = req.cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      token = authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as TokenPayload;
    req.user = decoded;
    
    // Verify user exists and is active
    const user = await userService.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Skip token blacklist and session timeout checks for initial implementation
    // Log API access
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'API_ACCESS',
          resourceType: 'Endpoint',
          resourceId: req.originalUrl,
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || 'Unknown',
          details: JSON.stringify({
            method: req.method,
            query: req.query,
            params: req.params
          }),
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error("Failed to create audit log:", logError);
      // Don't fail the request if logging fails
    }
    
    next();
  } catch (error) {
    // If token is expired, return specific message
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      // Log access denial (with error handling)
      try {
        prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'ACCESS_DENIED',
            resourceType: 'Endpoint',
            resourceId: req.originalUrl,
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || 'Unknown',
            details: JSON.stringify({
              method: req.method,
              requiredRoles: roles,
              userRole: req.user.role
            }),
            timestamp: new Date()
          }
        }).catch(console.error);
      } catch (logError) {
        console.error("Failed to create audit log for access denial:", logError);
      }
      
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};

// New middleware to handle PHI for specific sensitive routes that require detokenization
export const handlePHI = (requiredPurpose: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get purpose from query or default to the required purpose
    const purpose = req.query.purpose?.toString() || requiredPurpose;
    
    // Check if a detokenize action is explicitly requested
    const shouldDetokenize = req.query.detokenize === 'true';
    
    // Store these values in the request for route handlers to use
    req.phiContext = {
      purpose,
      shouldDetokenize,
      actorId: req.user.userId
    };
    
    next();
  };
};