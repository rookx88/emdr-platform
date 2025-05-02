import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';

export const therapistController = {
  // Get all therapists
  async getTherapists(req: Request, res: Response, next: NextFunction) {
    try {
      const therapists = await prisma.therapistProfile.findMany({
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
          _count: {
            select: {
              clients: true
            }
          }
        }
      });
      
      res.json(therapists);
    } catch (error) {
      next(error);
    }
  },
  
  // Get available therapists for client selection
  async getAvailableTherapists(req: Request, res: Response, next: NextFunction) {
    try {
      const therapists = await prisma.therapistProfile.findMany({
        where: {
          user: {
            isActive: true
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              clients: true
            }
          }
        }
      });
      
      res.json(therapists);
    } catch (error) {
      next(error);
    }
  },
  
  // Get a therapist by ID
  async getTherapistById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const therapist = await prisma.therapistProfile.findUnique({
        where: { id },
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
      
      if (!therapist) {
        return res.status(404).json({ message: 'Therapist not found' });
      }
      
      res.json(therapist);
    } catch (error) {
      next(error);
    }
  },
  
  // Get current therapist's profile
  async getMyTherapistProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user!;
      
      if (role !== 'THERAPIST') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const therapistProfile = await prisma.therapistProfile.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              clients: true
            }
          }
        }
      });
      
      if (!therapistProfile) {
        // Create a new therapist profile if it doesn't exist
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const newTherapistProfile = await prisma.therapistProfile.create({
          data: {
            userId,
            specialties: []
          }
        });
        
        return res.json({
          ...newTherapistProfile,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          _count: {
            clients: 0
          }
        });
      }
      
      res.json(therapistProfile);
    } catch (error) {
      next(error);
    }
  },
  
  // Update therapist profile
  async updateTherapistProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user!;
      const { id } = req.params;
      
      // Verify authorization
      if (role !== 'ADMIN' && role !== 'THERAPIST') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // If therapist, ensure they're updating their own profile
      if (role === 'THERAPIST') {
        const therapist = await prisma.therapistProfile.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!therapist || therapist.userId !== userId) {
          return res.status(403).json({ message: 'Unauthorized to update this profile' });
        }
      }
      
      const {
        bio,
        specialties,
        licenseNumber,
        licenseState,
        workingHours,
        breakTime,
        calendarEmail,
        calendarId
      } = req.body;
      
      // Update therapist profile
      const updatedProfile = await prisma.therapistProfile.update({
        where: { id },
        data: {
          bio,
          specialties,
          licenseNumber,
          licenseState,
          workingHours,
          breakTime,
          calendarEmail,
          calendarId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      // Create audit log
      await createAuditLog(
        userId,
        'UPDATE_THERAPIST_PROFILE',
        'TherapistProfile',
        id,
        { updatedFields: Object.keys(req.body) }
      );
      
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  },
  
  // Set therapist availability
  async setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user!;
      const { therapistId } = req.params;
      
      // Verify authorization
      if (role !== 'ADMIN' && role !== 'THERAPIST') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // If therapist, ensure they're updating their own availability
      if (role === 'THERAPIST') {
        const therapist = await prisma.therapistProfile.findUnique({
          where: { id: therapistId },
          select: { userId: true }
        });
        
        if (!therapist || therapist.userId !== userId) {
          return res.status(403).json({ message: 'Unauthorized to update this availability' });
        }
      }
      
      const { availability } = req.body;
      
      if (!Array.isArray(availability)) {
        return res.status(400).json({ message: 'Invalid availability format' });
      }
      
      // Update availability in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // First delete existing recurring availability
        await prisma.availabilityWindow.deleteMany({
          where: {
            therapistId,
            isRecurring: true
          }
        });
        
        // Then create new availability windows
        const created = await Promise.all(
          availability.map(slot => 
            prisma.availabilityWindow.create({
              data: {
                therapistId,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isRecurring: true
              }
            })
          )
        );
        
        return created;
      });
      
      // Create audit log
      await createAuditLog(
        userId,
        'SET_AVAILABILITY',
        'TherapistProfile',
        therapistId,
        { count: result.length }
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  
  // Get therapist availability
  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      
      const availability = await prisma.availabilityWindow.findMany({
        where: {
          therapistId,
          isRecurring: true
        },
        orderBy: {
          dayOfWeek: 'asc'
        }
      });
      
      res.json(availability);
    } catch (error) {
      next(error);
    }
  }
};