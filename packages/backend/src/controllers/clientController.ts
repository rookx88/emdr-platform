import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';
import { clientService } from '../services/clientService';

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
              createdAt: true
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
  
  // Fixed createClient function in clientController.ts
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
      
      // In a complete implementation, we would send an invite email here
      // with password reset instructions
      
      // Fixed response to avoid duplicate id
      res.status(201).json({
        // Remove the duplicate "id" property
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role
        },
        // Include clientProfile without manually spreading it
        clientProfile: result.clientProfile
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
  }
};