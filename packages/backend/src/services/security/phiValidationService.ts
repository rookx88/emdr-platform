// packages/backend/src/services/security/phiValidationService.ts
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../utils/auditLog';
import { phiVaultService } from '../encryption/phiVaultService';

/**
 * Service to handle validation of PHI tokenization
 */
export const phiValidationService = {
  /**
   * Validate a token to ensure it exists and is valid
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;
    
    // Check if token exists in the database
    const phiEntry = await prisma.protectedHealthInfo.findUnique({
      where: { token }
    });
    
    return !!phiEntry;
  },
  
  /**
   * Ensure a field that should contain tokenized PHI actually does
   */
  async validateTokenizedField(
    value: string, 
    fieldName: string, 
    userId: string,
    actorId: string
  ): Promise<{ valid: boolean; message: string }> {
    // If value is not a string or empty, consider it valid (no PHI to check)
    if (!value || typeof value !== 'string') {
      return { valid: true, message: 'No value to validate' };
    }
    
    // If the value is already properly tokenized, validate the token
    const tokenMatch = value.match(/\[PHI:([a-f0-9]{64})\]/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const isValid = await this.validateToken(token);
      
      if (!isValid) {
        // Log invalid token attempt
        await createAuditLog(
          actorId,
          'INVALID_PHI_TOKEN',
          'ProtectedHealthInfo',
          token,
          { fieldName }
        );
        
        return { 
          valid: false, 
          message: 'Invalid PHI token detected' 
        };
      }
      
      return { valid: true, message: 'Valid PHI token' };
    }
    
    // If the value is encrypted (direct database field), consider it valid
    if (phiVaultService.isEncrypted(value)) {
      return { valid: true, message: 'Encrypted data' };
    }
    
    // Otherwise, check if this should be tokenized based on content and field name
    const sensitiveFields = [
      'firstName', 'lastName', 'name', 'address', 'phoneNumber', 
      'email', 'dateOfBirth', 'dob', 'ssn', 'socialSecurity',
      'emergencyContact', 'emergencyPhone'
    ];
    
    // If the field name indicates PHI, it should be tokenized
    if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field.toLowerCase()))) {
      // Log untokenized PHI
      await createAuditLog(
        actorId,
        'UNTOKENIZED_PHI',
        'SecurityViolation',
        userId,
        { fieldName }
      );
      
      return { 
        valid: false, 
        message: 'Sensitive field contains untokenized data' 
      };
    }
    
    // Check for PHI patterns in the value
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
    
    // If the value matches any PHI pattern, it should be tokenized
    for (const pattern of phiPatterns) {
      if (pattern.test(value)) {
        // Log untokenized PHI
        await createAuditLog(
          actorId,
          'UNTOKENIZED_PHI',
          'SecurityViolation',
          userId,
          { fieldName, pattern: pattern.toString() }
        );
        
        return { 
          valid: false, 
          message: 'Field contains untokenized personal health information' 
        };
      }
    }
    
    // If we got here, the value is considered safe
    return { valid: true, message: 'No PHI detected' };
  },
  
  /**
   * Recursively scan an object for fields that need tokenization
   */
  async validateObject(
    obj: any, 
    userId: string,
    actorId: string,
    parentField: string = ''
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Handle null/undefined
    if (!obj) {
      return { valid: true, issues: [] };
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = await this.validateObject(
          obj[i], 
          userId, 
          actorId,
          `${parentField}[${i}]`
        );
        
        if (!result.valid) {
          issues.push(...result.issues);
        }
      }
      
      return { valid: issues.length === 0, issues };
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const fieldPath = parentField ? `${parentField}.${key}` : key;
          
          if (typeof value === 'string') {
            const result = await this.validateTokenizedField(
              value, 
              key, 
              userId,
              actorId
            );
            
            if (!result.valid) {
              issues.push(`${fieldPath}: ${result.message}`);
            }
          } else if (typeof value === 'object' && value !== null) {
            const result = await this.validateObject(
              value, 
              userId, 
              actorId,
              fieldPath
            );
            
            if (!result.valid) {
              issues.push(...result.issues);
            }
          }
        }
      }
      
      return { valid: issues.length === 0, issues };
    }
    
    // If not object, array, or string, it's valid (can't contain PHI)
    return { valid: true, issues: [] };
  }
};