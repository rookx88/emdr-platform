import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
  
  
  async getClientWithDetails(clientId: string): Promise<any> {
    return prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        therapist: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        appointments: {
          orderBy: {
            startTime: 'desc'
          },
          take: 10
        }
      }
    });
  },
  
  /**
   * Get recent client activity
   */
  async getClientActivity(clientId: string): Promise<any> {
    // Find client user ID first
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { userId: true }
    });
    
    if (!client) return [];
    
    // Get user activity
    return prisma.userActivity.findMany({
      where: { userId: client.userId },
      orderBy: { timestamp: 'desc' },
      take: 20
    });
  }
};
