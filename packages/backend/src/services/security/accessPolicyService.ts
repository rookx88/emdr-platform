// Access Policy Service for PHI
import { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../utils/auditLog';

// Log access attempt
const logAccessAttempt = async (
  userId: string,
  phiToken: string,
  wasAuthorized: boolean,
  request: Request,
  purpose?: string
) => {
  await prisma.pHIAccessAttempt.create({
    data: {
      userId,
      phiToken,
      wasAuthorized,
      ipAddress: request.ip || '0.0.0.0',
      userAgent: request.headers['user-agent'] || 'Unknown',
      purpose,
      timestamp: new Date()
    }
  });
  
  // Also create audit log entry
  await createAuditLog(
    userId,
    wasAuthorized ? 'PHI_ACCESS_GRANTED' : 'PHI_ACCESS_DENIED',
    'ProtectedHealthInfo',
    phiToken,
    { 
      purpose,
      ipAddress: request.ip || '0.0.0.0'
    }
  );
};

// Check if a user can access PHI based on role and relationship
const canAccessPHI = async (
  actorId: string, 
  targetUserId: string,
  phiType: string,
  request: Request,
  purpose?: string
): Promise<boolean> => {
  try {
    if (!actorId || !targetUserId) {
      return false;
    }
    
    // Always allow access to own PHI
    if (actorId === targetUserId) {
      await logAccessAttempt(actorId, `SELF_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
      return true;
    }
    
    // Get actor's role
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true }
    });
    
    if (!actor) {
      await logAccessAttempt(actorId, `UNKNOWN_ACTOR:${targetUserId}:${phiType}`, false, request, purpose);
      return false;
    }
    
    // Admin can access all PHI
    if (actor.role === 'ADMIN') {
      await logAccessAttempt(actorId, `ADMIN_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
      return true;
    }
    
    // Therapists can access their clients' PHI
    if (actor.role === 'THERAPIST') {
      // Check if client belongs to this therapist
      const therapistProfile = await prisma.therapistProfile.findFirst({
        where: { userId: actorId }
      });
      
      if (!therapistProfile) {
        await logAccessAttempt(actorId, `NO_THERAPIST_PROFILE:${targetUserId}:${phiType}`, false, request, purpose);
        return false;
      }
      
      const clientProfile = await prisma.clientProfile.findFirst({
        where: { 
          userId: targetUserId,
          therapistId: therapistProfile.id
        }
      });
      
      if (clientProfile) {
        await logAccessAttempt(actorId, `THERAPIST_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
        return true;
      }
    }
    
    // All other access attempts are denied
    await logAccessAttempt(actorId, `DENIED:${targetUserId}:${phiType}`, false, request, purpose);
    return false;
  } catch (error) {
    console.error('Error in access policy check:', error);
    // Log failed check attempt
    try {
      await logAccessAttempt(actorId, `ERROR:${targetUserId}:${phiType}`, false, request, purpose);
    } catch (logError) {
      console.error('Error logging access attempt:', logError);
    }
    return false;
  }
};

export const accessPolicyService = {
  canAccessPHI,
  logAccessAttempt
};
