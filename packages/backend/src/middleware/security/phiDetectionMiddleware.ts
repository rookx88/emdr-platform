// PHI Detection Middleware
import { Request, Response, NextFunction } from 'express';
import { phiVaultService } from '../../services/encryption/phiVaultService';

export const phiDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip for certain endpoints that don't need PHI detection
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/health',
      // Add other paths that don't need PHI detection
    ];
    
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Only process if user is authenticated
    if (!req.user) {
      return next();
    }
    
    // Process request body if it exists and is JSON
    if (req.body && typeof req.body === 'object') {
      // Create a deep copy of the request body
      const processedBody = JSON.parse(JSON.stringify(req.body));
      
      // Process specific fields that might contain PHI
      const sensitiveFields = ['notes', 'content', 'message', 'description'];
      
      // Process each field recursively
      const processObject = async (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && sensitiveFields.includes(key)) {
            // Tokenize PHI in text content
            obj[key] = await phiVaultService.tokenizePHIInText(
              obj[key],
              req.user.userId,
              req.user.userId
            );
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively process nested objects
            await processObject(obj[key]);
          }
        }
      };
      
      await processObject(processedBody);
      
      // Replace the request body with the processed version
      req.body = processedBody;
    }
    
    next();
  } catch (error) {
    console.error('Error in PHI detection middleware:', error);
    next(error);
  }
};
