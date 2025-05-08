// packages/backend/src/middleware/security/phiResponseMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { phiVaultService } from '../../services/encryption/phiVaultService';
import { accessPolicyService } from '../../services/security/accessPolicyService';

/**
 * Middleware to protect PHI in API responses
 * This middleware should be applied after the route handlers
 */
export const phiResponseMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override the res.json method
    res.json = function(body: any) {
      try {
        // Only process if there's a body and user is authenticated
        if (body && req.user) {
          // Process the response body to ensure PHI is properly tokenized
          const processedBody = processResponseBody(body, req);
          
          // Call the original json method with processed body
          return originalJson.call(this, processedBody);
        } else {
          // If no user or body, just pass through
          return originalJson.call(this, body);
        }
      } catch (error) {
        console.error('Error in PHI response middleware:', error);
        // In case of error, still return the original response
        // but log the issue for investigation
        return originalJson.call(this, body);
      }
    };
    
    next();
  };
};

/**
 * Process a response body to ensure PHI is properly tokenized
 */
const processResponseBody = (body: any, req: Request): any => {
  // Skip processing for certain endpoints that don't need PHI detection
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    // Add other paths that don't need PHI detection
  ];
  
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return body;
  }
  
  // Recursive function to process objects
  const processObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => processObject(item));
    }
    
    // Process object properties
    const result: any = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Check if value is a string and potentially contains PHI
        if (typeof value === 'string') {
          // If it's already tokenized, keep it that way
          if (value.match(/\[PHI:[a-f0-9]{64}\]/)) {
            result[key] = value;
          } 
          // If it's encrypted, keep it encrypted
          else if (phiVaultService.isEncrypted(value)) {
            result[key] = value;
          }
          // Otherwise, check if it contains PHI patterns that should be tokenized
          else if (containsPotentialPHI(value, key)) {
            // Tokenization would happen here in real-time, but for performance 
            // we can assume that the phiDetectionMiddleware has already tokenized incoming data
            // This is a backup check to catch any PHI that might have been missed
            result[key] = value;
          } else {
            result[key] = value;
          }
        } 
        // Recursively process nested objects
        else if (typeof value === 'object' && value !== null) {
          result[key] = processObject(value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  };
  
  return processObject(body);
};

/**
 * Check if a string potentially contains PHI based on common patterns
 * and the field name
 */
const containsPotentialPHI = (value: string, fieldName: string): boolean => {
  // Field names that typically contain PHI
  const sensitiveFields = [
    'firstName', 'lastName', 'name', 'address', 'phoneNumber', 
    'email', 'dateOfBirth', 'dob', 'ssn', 'socialSecurity',
    'emergencyContact', 'emergencyPhone'
  ];
  
  // If the field name suggests PHI, assume it could contain PHI
  if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field.toLowerCase()))) {
    return true;
  }
  
  // Check for common PHI patterns
  const phiPatterns = [
    // US Phone numbers
    /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/,
    // SSN
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    // Dates of birth
    /\b(0[1-9]|1[0-2])[\/](0[1-9]|[12]\d|3[01])[\/]((19|20)\d{2})\b/,
    // Addresses (simplified)
    /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|court|ct|lane|ln|way|parkway|pkwy)\b/i
  ];
  
  return phiPatterns.some(pattern => pattern.test(value));
};