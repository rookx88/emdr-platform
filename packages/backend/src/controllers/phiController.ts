// packages/backend/src/controllers/phiController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { phiDetokenizationService } from '../services/encryption/phiDetokenizationService';
import { phiValidationService } from '../services/security/phiValidationService';
import { accessPolicyService } from '../services/security/accessPolicyService';
import { phiVaultService } from '../services/encryption/phiVaultService';
import { createAuditLog } from '../utils/auditLog';
import * as securityScan from '../utils/phi/securityScan';

/**
 * Controller for PHI-related operations
 */
export const phiController = {
  /**
   * View PHI with proper authorization and purpose logging
   */
  async viewPHI(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { purpose } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'PHI token is required' });
      }
      
      if (!purpose) {
        return res.status(400).json({ message: 'Purpose is required for viewing PHI' });
      }
      
      // Find PHI entry
      const phiEntry = await prisma.protectedHealthInfo.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              role: true
            }
          }
        }
      });
      
      if (!phiEntry) {
        return res.status(404).json({ message: 'PHI not found' });
      }
      
      // Check access rights
      const hasAccess = await accessPolicyService.canAccessPHI(
        req.user!.userId,
        phiEntry.userId,
        phiEntry.phiType,
        req,
        purpose
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this PHI' });
      }
      
      // Decrypt and return the PHI
      const decryptedData = phiVaultService.decryptPHI(phiEntry.encryptedData);
      
      // Log successful access
      await createAuditLog(
        req.user!.userId,
        'VIEW_PHI',
        'ProtectedHealthInfo',
        token,
        { purpose, phiType: phiEntry.phiType }
      );
      
      res.json({
        data: decryptedData,
        phiType: phiEntry.phiType,
        userId: phiEntry.userId,
        accessTime: new Date()
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Detokenize text for authorized viewing
   */
  async detokenizeText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, purpose } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      if (!purpose) {
        return res.status(400).json({ message: 'Purpose is required for detokenizing PHI' });
      }
      
      // Process the text to replace PHI tokens with actual values
      const detokenizedText = await phiDetokenizationService.detokenizeText(
        text,
        req.user!.userId,
        purpose,
        req
      );
      
      res.json({ text: detokenizedText });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Tokenize text containing PHI
   */
  async tokenizeText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, userId, phiType } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      if (!phiType) {
        return res.status(400).json({ message: 'PHI type is required' });
      }
      
      // Check if the actor has permission to tokenize for this user
      const hasAccess = await accessPolicyService.canAccessPHI(
        req.user!.userId,
        userId,
        phiType,
        req,
        'Tokenizing PHI'
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to tokenize PHI for this user' });
      }
      
      // Tokenize the text
      const tokenizedText = await phiVaultService.tokenizePHIInText(
        text,
        userId,
        req.user!.userId
      );
      
      res.json({ text: tokenizedText });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Run a security scan for unencrypted PHI (admin only)
   */
  async runSecurityScan(req: Request, res: Response, next: NextFunction) {
    try {
      // Only admins can run security scans
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only administrators can run security scans' });
      }
      
      // Start the scan
      const scanId = await securityScan.scanForUnencryptedPHI(req.user!.userId);
      
      res.json({ 
        message: 'Security scan initiated', 
        scanId,
        status: 'IN_PROGRESS'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get the results of a security scan (admin only)
   */
  async getSecurityScanResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { scanId } = req.params;
      
      // Only admins can view security scan results
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only administrators can view security scan results' });
      }
      
      // Get the scan results
      const scan = await prisma.securityScan.findUnique({
        where: { id: scanId }
      });
      
      if (!scan) {
        return res.status(404).json({ message: 'Security scan not found' });
      }
      
      res.json(scan);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Fix unencrypted PHI found in a security scan (admin only)
   */
  async fixUnencryptedPHI(req: Request, res: Response, next: NextFunction) {
    try {
      const { scanId } = req.params;
      
      // Only admins can run security fixes
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only administrators can fix unencrypted PHI' });
      }
      
      // Run the fix
      const results = await securityScan.encryptUnencryptedPHI(scanId, req.user!.userId);
      
      res.json({
        message: 'Unencrypted PHI has been fixed',
        results
      });
    } catch (error) {
      next(error);
    }
  }
};