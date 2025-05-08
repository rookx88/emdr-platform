// packages/backend/src/services/encryption/phiDetokenizationService.ts
import { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { phiVaultService } from './phiVaultService';
import { accessPolicyService } from '../security/accessPolicyService';
import { createAuditLog } from '../../utils/auditLog';

/**
 * Service to handle detokenization of PHI for authorized viewing
 */
export const phiDetokenizationService = {
  /**
   * Detokenize a specific PHI token if the user has access
   */
  async detokenizePHI(
    token: string, 
    actorId: string, 
    purpose: string,
    request: Request
  ): Promise<string | null> {
    if (!token) return null;
    
    // Find the PHI entry
    const phiEntry = await prisma.protectedHealthInfo.findUnique({
      where: { token }
    });
    
    if (!phiEntry) return null;
    
    // Check if the actor has access to this PHI
    const hasAccess = await accessPolicyService.canAccessPHI(
      actorId, 
      phiEntry.userId,
      phiEntry.phiType,
      request,
      purpose
    );
    
    if (!hasAccess) {
      return null;
    }
    
    // Update last accessed timestamp
    await prisma.protectedHealthInfo.update({
      where: { token },
      data: { lastAccessed: new Date() }
    });
    
    // Log successful access
    await createAuditLog(
      actorId,
      'DETOKENIZE_PHI',
      'ProtectedHealthInfo',
      token,
      { purpose, phiType: phiEntry.phiType }
    );
    
    // Decrypt and return the PHI
    return phiVaultService.decryptPHI(phiEntry.encryptedData);
  },
  
  /**
   * Process text to replace all PHI tokens with their actual values
   * for authorized viewing
   */
  async detokenizeText(
    text: string, 
    actorId: string, 
    purpose: string,
    request: Request
  ): Promise<string> {
    if (!text) return text;
    
    const tokenPattern = /\[PHI:([a-f0-9]{64})\]/g;
    let result = text;
    
    // To avoid TypeScript issues with RegExp.exec() and the while loop,
    // use a different approach with matchAll() which is more type-safe
    const matches = Array.from(text.matchAll(tokenPattern));
    
    // Process each token
    for (const match of matches) {
      if (match && match[0] && match[1]) {
        const fullMatch = match[0];  // The entire match, e.g., "[PHI:1234...]"
        const token = match[1];      // Just the token part, e.g., "1234..."
        
        const phiValue = await this.detokenizePHI(
          token, 
          actorId, 
          purpose,
          request
        );
        
        if (phiValue) {
          // Replace token with actual value
          result = result.replace(fullMatch, phiValue);
        }
      }
    }
    
    return result;
  },
  
  /**
   * Process an object to replace all PHI tokens with their actual values
   * for authorized viewing
   */
  async detokenizeObject(
    obj: any, 
    actorId: string, 
    purpose: string,
    request: Request
  ): Promise<any> {
    if (!obj) return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => 
        this.detokenizeObject(item, actorId, purpose, request)
      ));
    }
    
    // Handle objects
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          
          if (typeof value === 'string') {
            // Detokenize string values
            result[key] = await this.detokenizeText(value, actorId, purpose, request);
          } else if (typeof value === 'object' && value !== null) {
            // Recursively detokenize nested objects
            result[key] = await this.detokenizeObject(value, actorId, purpose, request);
          } else {
            // Pass through other value types
            result[key] = value;
          }
        }
      }
      
      return result;
    }
    
    // Return primitive values as is
    return obj;
  }
};