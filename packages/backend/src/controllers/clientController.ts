// packages/backend/src/controllers/clientController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';
import { clientService } from '../services/clientService';
import { userService } from '../services/userService';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { emailService } from '../services/emailService';
import { Appointment } from '@prisma/client';

export const clientController = {
  // Get all clients (for therapists and admins)
  async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, userId } = req.user!;
      
      // Only therapists and admins can access client lists
      if (role !== 'THERAPIST' && role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      let clients;
      
      // If therapist, only return their clients
      if (role === 'THERAPIST') {
        // Get therapist profile ID
        const therapistProfile = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapistProfile) {
          return res.status(404).json({ message: 'Therapist profile not found' });
        }
        
        clients = await prisma.clientProfile.findMany({
          where: { therapistId: therapistProfile.id },
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
      } else {
        // Admins can see all clients
        clients = await prisma.clientProfile.findMany({
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
            },
            therapist: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });
      }
      
      // Create audit log
      await createAuditLog(
        userId,
        'LIST_CLIENTS',
        'ClientProfile',
        'ALL',
        { count: clients.length }
      );
      
      res.json(clients);
    } catch (error) {
      next(error);
    }
  },
  
  // Get a specific client by ID
  async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user!;
      
      // Validate authorization to view this client
      const isAuthorized = await clientService.canAccessClient(userId, id, role);
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to access this client' });
      }
      
      const client = await prisma.clientProfile.findUnique({
        where: { id },
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
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          appointments: {
            orderBy: {
              startTime: 'desc'
            },
            take: 5
          }
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Create audit log
      await createAuditLog(
        userId,
        'VIEW_CLIENT',
        'ClientProfile',
        id,
        {}
      );
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  },
  
  // Get currently logged in client's profile
  async getMyClientProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user!;
      
      // Only clients can access their own profile
      if (role !== 'CLIENT') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const clientProfile = await prisma.clientProfile.findFirst({
        where: { userId },
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
          },
          therapist: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          appointments: {
            where: {
              startTime: {
                gte: new Date()
              },
              status: {
                not: 'CANCELED'
              }
            },
            orderBy: {
              startTime: 'asc'
            },
            take: 3
          }
        }
      });
      
      if (!clientProfile) {
        // Create a new client profile if it doesn't exist
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const newClientProfile = await prisma.clientProfile.create({
          data: {
            userId,
            // Add default values if needed
          }
        });
        
        return res.json({
          ...newClientProfile,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive
          },
          appointments: []
        });
      }
      
      res.json(clientProfile);
    } catch (error) {
      next(error);
    }
  },
  
  // Create a new client
  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, userId } = req.user!;
      
      // Only therapists and admins can create clients
      if (role !== 'THERAPIST' && role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const {
        email,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        address,
        emergencyContact,
        emergencyPhone,
        preferredDays,
        preferredTimes,
        appointmentDuration,
        therapistId: requestedTherapistId
      } = req.body;
      
      // Determine therapist ID
      let therapistId = requestedTherapistId;
      
      if (!therapistId && role === 'THERAPIST') {
        // If therapist is creating and no therapistId specified, use their ID
        const therapistProfile = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapistProfile) {
          return res.status(400).json({ message: 'Therapist profile not found' });
        }
        
        therapistId = therapistProfile.id;
      }
      
      // Validate that email is not already in use
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already in use' });
      }
      
      // Create user and client profile in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            // Generate a temporary password that will need to be reset
            passwordHash: await clientService.generateTemporaryPasswordHash(),
            firstName,
            lastName,
            role: 'CLIENT'
          }
        });
        
        // Create client profile
        const clientProfile = await prisma.clientProfile.create({
          data: {
            userId: user.id,
            phoneNumber,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            address,
            emergencyContact,
            emergencyPhone,
            preferredDays: preferredDays || [],
            preferredTimes: preferredTimes || [],
            appointmentDuration: appointmentDuration || 50,
            therapistId
          }
        });
        
        return { user, clientProfile };
      });
      
      // Create audit log
      await createAuditLog(
        userId,
        'CREATE_CLIENT',
        'ClientProfile',
        result.clientProfile.id,
        { email }
      );
      
      // Return a properly structured response
      res.status(201).json({
        clientProfile: result.clientProfile,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Update an existing client
  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user!;
      
      // Validate authorization to update this client
      const isAuthorized = await clientService.canAccessClient(userId, id, role);
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to update this client' });
      }
      
      const {
        phoneNumber,
        dateOfBirth,
        address,
        emergencyContact,
        emergencyPhone,
        preferredDays,
        preferredTimes,
        appointmentDuration,
        therapistId
      } = req.body;
      
      // If user is not admin, they can't change therapist
      if (role !== 'ADMIN' && therapistId) {
        // Check if user is the current therapist
        const clientProfile = await prisma.clientProfile.findUnique({
          where: { id }
        });
        
        if (clientProfile?.therapistId !== therapistId) {
          return res.status(403).json({ message: 'Cannot change therapist assignment' });
        }
      }
      
      // Update client profile
      const updatedClient = await prisma.clientProfile.update({
        where: { id },
        data: {
          phoneNumber,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          emergencyContact,
          emergencyPhone,
          preferredDays: preferredDays || undefined,
          preferredTimes: preferredTimes || undefined,
          appointmentDuration: appointmentDuration || undefined,
          therapistId: therapistId || undefined
        },
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
      
      // Create audit log
      await createAuditLog(
        userId,
        'UPDATE_CLIENT',
        'ClientProfile',
        id,
        { updatedFields: Object.keys(req.body) }
      );
      
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  },
  
  // Delete client
  async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      
      // Only admins can delete clients
      if (role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized to delete clients' });
      }
      
      // Check if client exists
      const client = await prisma.clientProfile.findUnique({
        where: { id },
        include: {
          user: true
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Delete client profile and related user in a transaction
      await prisma.$transaction([
        // First deactivate the user (soft delete)
        prisma.user.update({
          where: { id: client.user.id },
          data: { isActive: false }
        }),
        
        // Log deletion
        prisma.auditLog.create({
          data: {
            userId,
            action: 'DELETE_CLIENT',
            resourceType: 'ClientProfile',
            resourceId: id,
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'Unknown',
            details: JSON.stringify({ clientId: id, userDeleted: false }),
            timestamp: new Date()
          }
        })
      ]);
      
      res.json({ message: 'Client deactivated successfully' });
    } catch (error) {
      next(error);
    }
  },
  
  // Restore client
  async restoreClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      
      // Only admins can restore clients
      if (role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized to restore clients' });
      }
      
      // Check if client exists
      const client = await prisma.clientProfile.findUnique({
        where: { id },
        include: {
          user: true
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Restore user
      await prisma.$transaction([
        prisma.user.update({
          where: { id: client.user.id },
          data: { isActive: true }
        }),
        
        // Log restoration
        prisma.auditLog.create({
          data: {
            userId,
            action: 'RESTORE_CLIENT',
            resourceType: 'ClientProfile',
            resourceId: id,
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'Unknown',
            details: JSON.stringify({ clientId: id }),
            timestamp: new Date()
          }
        })
      ]);
      
      res.json({ message: 'Client restored successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Verify invite token
  async verifyInviteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }
      
      // Find the invitation token
      const invitation = await prisma.invitationToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true
            }
          }
        }
      });
      
      if (!invitation) {
        return res.status(404).json({ message: 'Invalid or expired invitation' });
      }
      
      // Check if token is expired
      if (new Date() > invitation.expiresAt) {
        return res.status(410).json({ 
          message: 'This invitation has expired', 
          expired: true 
        });
      }
      
      // Check if token has been used already
      if (!invitation.isActive || invitation.usedAt) {
        return res.status(410).json({ 
          message: 'This invitation has already been used', 
          used: true 
        });
      }
      
      // Check if user is active
      if (!invitation.user.isActive) {
        return res.status(403).json({ 
          message: 'The associated account is inactive', 
          inactive: true 
        });
      }
      
      // Get the client profile
      const clientProfile = await prisma.clientProfile.findFirst({
        where: { userId: invitation.user.id }
      });
      
      // Get the therapist name
      const therapistName = clientProfile?.therapistId ? 
        await getTherapistName(clientProfile.therapistId) : 'Your therapist';
      
      // Get first session if it exists
      let sessionInfo: Appointment | null = null;
      if (clientProfile) {
        const firstSession = await prisma.appointment.findFirst({
          where: {
            clientId: clientProfile.id,
            startTime: {
              gte: new Date()
            },
            status: {
              not: 'CANCELED'
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        });
        
        if (firstSession) {
          sessionInfo = firstSession;
        }
      }
      
      // Return enhanced information
      res.json({
        valid: true,
        email: invitation.user.email,
        firstName: invitation.user.firstName,
        lastName: invitation.user.lastName,
        therapistName: therapistName,
        expiresAt: invitation.expiresAt,
        sessionInfo: sessionInfo
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Complete registration with invite token
  async completeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password, confirmPassword, firstName, lastName } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      // Find the invitation token
      const invitation = await prisma.invitationToken.findUnique({
        where: { token },
        include: {
          user: true
        }
      });
      
      if (!invitation) {
        return res.status(404).json({ message: 'Invalid or expired invitation' });
      }
      
      // Check if token is expired
      if (new Date() > invitation.expiresAt) {
        return res.status(410).json({ 
          message: 'This invitation has expired', 
          expired: true 
        });
      }
      
      // Check if token has been used already
      if (!invitation.isActive || invitation.usedAt) {
        return res.status(410).json({ 
          message: 'This invitation has already been used', 
          used: true 
        });
      }
      
      // Update user and mark token as used
      await prisma.$transaction(async (prisma) => {
        // Update user account with new password and profile info
        await userService.updatePassword(invitation.userId, password);
        
        // Update user info
        await prisma.user.update({
          where: { id: invitation.userId },
          data: {
            firstName: firstName || invitation.user.firstName,
            lastName: lastName || invitation.user.lastName,
            isActive: true
          }
        });
        
        // Mark the token as used
        await prisma.invitationToken.update({
          where: { id: invitation.id },
          data: {
            isActive: false,
            usedAt: new Date()
          }
        });
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: invitation.userId,
            action: 'COMPLETE_REGISTRATION',
            resourceType: 'User',
            resourceId: invitation.userId,
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'Unknown',
            details: JSON.stringify({ registrationCompleted: true }),
            timestamp: new Date()
          }
        });
      });
      
      res.json({ 
        message: 'Registration completed successfully', 
        email: invitation.user.email 
      });
    } catch (error) {
      next(error);
    }
  },

  // Invite client
  async inviteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        email, 
        firstName, 
        lastName, 
        phoneNumber, 
        sendWelcomeEmail,
        session 
      } = req.body;
      
      const { userId, role } = req.user!;
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          message: 'A user with this email already exists' 
        });
      }
      
      // Determine therapist ID based on role
      let therapistId: string | null = null;
      
      if (role === 'THERAPIST') {
        // Get therapist's own profile
        const therapistProfile = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapistProfile) {
          return res.status(400).json({ 
            message: 'Therapist profile not found'
          });
        }
        
        therapistId = therapistProfile.id;
      } else if (role === 'ADMIN') {
        // Admin should provide therapistId if needed
        therapistId = req.body.therapistId || null;
      }
      
      // Generate a secure invitation token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token valid for 7 days
      
      // Create everything in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create user with temporary password
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
        
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'CLIENT',
            // Mark as inactive until they complete signup
            isActive: false
          }
        });
        
        // Create client profile
        const clientProfile = await prisma.clientProfile.create({
          data: {
            userId: user.id,
            phoneNumber,
            therapistId
          }
        });
        
        // Store the invitation token
        await prisma.invitationToken.create({
          data: {
            token: inviteToken,
            userId: user.id,
            expiresAt: tokenExpiry,
            isActive: true
          }
        });
        
        // Create initial session if requested
        let createdSession: Appointment | null = null;
        if (session) {
          const { date, time, type, notes } = session;
          
          if (!therapistId) {
            throw new Error('Cannot schedule session without a therapist assignment');
          }
          
          // Combine date and time
          const scheduledAt = new Date(`${date}T${time}`);
          
          // Calculate end time (default 50 min session)
          const duration = 50; // minutes
          const endTime = new Date(scheduledAt);
          endTime.setMinutes(endTime.getMinutes() + duration);
          
          createdSession = await prisma.appointment.create({
            data: {
              title: `${type} Session with ${firstName || 'New Client'}`,
              startTime: scheduledAt,
              endTime: endTime,
              status: 'SCHEDULED',
              type: type,
              notes: notes,
              clientId: clientProfile.id,
              therapistId: therapistId,
              isVirtual: true
            }
          });
        }
        
        return { user, clientProfile, inviteToken, session: createdSession };
      });
      
      // Send welcome email with invite link
      if (sendWelcomeEmail) {
        await emailService.sendClientInvitation({
          to: email,
          clientName: firstName || 'Client',
          inviteToken: result.inviteToken,
          therapistName: await getTherapistName(therapistId),
          sessionDetails: result.session ? {
            date: new Date(result.session.startTime).toLocaleDateString(),
            time: new Date(result.session.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: result.session.type
          } : null
        });
      }
      
      // Log the invitation
      await createAuditLog(
        userId,
        'INVITE_CLIENT',
        'ClientProfile',
        result.clientProfile.id,
        { 
          email,
          hasSession: !!result.session,
          tokenGenerated: true
        }
      );
      
      // Return success but hide the actual token for security
      res.status(201).json({
        message: 'Client invitation sent successfully',
        clientId: result.clientProfile.id,
        inviteSent: sendWelcomeEmail,
        expiryDate: tokenExpiry
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Assign therapist to client
  async assignTherapist(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { therapistId } = req.body;
      const { userId, role } = req.user!;
      
      // Validate input
      if (!therapistId) {
        return res.status(400).json({ message: 'Therapist ID is required' });
      }
      
      // Check authorization - only admins or the assigned therapist can change
      if (role !== 'ADMIN') {
        if (role !== 'THERAPIST') {
          return res.status(403).json({ message: 'Unauthorized to assign therapist' });
        }
        
        // If therapist, check if they are the assigned therapist
        const therapistProfile = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapistProfile || therapistProfile.id !== therapistId) {
          return res.status(403).json({ message: 'Unauthorized to assign therapist' });
        }
      }
      
      // Check if client exists
      const client = await prisma.clientProfile.findUnique({
        where: { id: clientId }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Check if therapist exists
      const therapist = await prisma.therapistProfile.findUnique({
        where: { id: therapistId }
      });
      
      if (!therapist) {
        return res.status(404).json({ message: 'Therapist not found' });
      }
      
      // Update client with new therapist
      const updatedClient = await prisma.clientProfile.update({
        where: { id: clientId },
        data: { therapistId },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      
      // Log assignment
      await createAuditLog(
        userId,
        'ASSIGN_THERAPIST',
        'ClientProfile',
        clientId,
        { therapistId }
      );
      
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to get therapist name
async function getTherapistName(therapistId: string | null): Promise<string> {
  if (!therapistId) return 'Your therapist';
  
  const therapist = await prisma.therapistProfile.findUnique({
    where: { id: therapistId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  if (!therapist || !therapist.user) return 'Your therapist';
  
  return `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`.trim() || 'Your therapist';
}