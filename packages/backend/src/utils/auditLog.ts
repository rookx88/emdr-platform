// packages/backend/src/utils/auditLog.ts
import { prisma } from '../lib/prisma';

/**
 * Create an audit log entry
 * @param userId User ID
 * @param action Action performed
 * @param resourceType Type of resource
 * @param resourceId Resource ID
 * @param details Additional details
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress: '0.0.0.0', // In a real app, get from request
        userAgent: 'System', // In a real app, get from request
        details: details ? JSON.stringify(details) : null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw here - audit logs should not break the main functionality
  }
};