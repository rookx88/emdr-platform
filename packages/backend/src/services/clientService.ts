// packages/backend/src/services/clientService.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createAuditLog } from '../utils/auditLog';

const prisma = new PrismaClient();

export const clientService = {
  /**
   * Check if a user has access to a specific client
   */
  async canAccessClient(userId: string, clientId: string, userRole: string): Promise<boolean> {
    // Admins can access any client
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // If user is a therapist, check if they're the client's therapist
    if (userRole === 'THERAPIST') {
      const therapistProfile = await prisma.therapistProfile.findFirst({
        where: { userId }
      });
      
      if (!therapistProfile) {
        return false;
      }
      
      const client = await prisma.clientProfile.findUnique({
        where: { id: clientId }
      });
      
      return client?.therapistId === therapistProfile.id;
    }
    
    // If user is a client, check if they're accessing their own profile
    if (userRole === 'CLIENT') {
      const clientProfile = await prisma.clientProfile.findFirst({
        where: { userId }
      });
      
      return clientProfile?.id === clientId;
    }
    
    return false;
  },
  
  /**
   * Generate a temporary password hash for new clients
   */
  async generateTemporaryPasswordHash(): Promise<string> {
    // Generate a random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    return hash;
  },
  
  /**
   * Get clients for a specific therapist
   */
  async getClientsForTherapist(therapistId: string) {
    return prisma.clientProfile.findMany({
      where: { therapistId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
          }
        }
      }
    });
  },
  
  /**
   * Generate an invitation token for a new client
   */
  async generateInviteToken(userId: string, expiryDays: number = 7): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Store the token in the database
    await prisma.invitationToken.create({
      data: {
        token,
        userId,
        expiresAt,
        isActive: true
      }
    });
    
    return token;
  },
  
  /**
   * Verify if an invitation token is valid
   */
  async verifyInviteToken(token: string): Promise<{ valid: boolean; userId?: string; message?: string }> {
    // Find the token
    const invitation = await prisma.invitationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true
          }
        }
      }
    });
    
    // Token doesn't exist
    if (!invitation) {
      return { valid: false, message: 'Invalid invitation token' };
    }
    
    // Token has expired
    if (new Date() > invitation.expiresAt) {
      return { valid: false, message: 'Invitation token has expired' };
    }
    
    return { valid: true, userId: invitation.userId };
  },
};