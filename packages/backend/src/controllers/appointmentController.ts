import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';
import { appointmentService } from '../services/appointmentService';

export const appointmentController = {
  async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        clientId, 
        therapistId, 
        startTime, 
        endTime, 
        type, 
        notes, 
        isVirtual 
      } = req.body;

      // Validate the user has permission to create this appointment
      const isAuthorized = await appointmentService.validateAppointmentAccess(
        req.user!.userId,
        clientId,
        therapistId
      );

      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to create this appointment' });
      }

      // Check for scheduling conflicts
      const hasConflict = await appointmentService.checkForConflicts(
        therapistId,
        startTime,
        endTime
      );

      if (hasConflict) {
        return res.status(409).json({ message: 'This time slot conflicts with an existing appointment' });
      }

      // Create the appointment
      const appointment = await appointmentService.createAppointment({
        title: `${type} Session`,
        clientId,
        therapistId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        notes,
        isVirtual,
        status: 'SCHEDULED'
      });

      // Create audit log
      await createAuditLog(
        req.user!.userId,
        'CREATE_APPOINTMENT',
        'Appointment',
        appointment.id,
        { clientId, therapistId, startTime }
      );

      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  },

  async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        startDate, 
        endDate, 
        status 
      } = req.query;

      // Parse date filters
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate as string);
      }

      // Build filter based on user role
      const filter: any = {};
      
      // Add date filter if present
      if (Object.keys(dateFilter).length > 0) {
        filter.startTime = dateFilter;
      }
      
      // Add status filter if present
      if (status) {
        filter.status = status;
      }

      // Get appointments based on user role and permissions
      const appointments = await appointmentService.getAppointmentsForUser(
        req.user!.userId,
        req.user!.role,
        filter
      );

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  },

  async getAppointmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          therapist: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check authorization
      const isAuthorized = await appointmentService.validateAppointmentAccess(
        userId,
        appointment.clientId,
        appointment.therapistId
      );
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to view this appointment' });
      }
      
      // Log access for audit
      await createAuditLog(
        userId,
        'VIEW_APPOINTMENT',
        'Appointment',
        id,
        {}
      );
      
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  },

  async updateAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      
      const {
        startTime,
        endTime,
        status,
        notes
      } = req.body;
      
      // Get existing appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check authorization
      const isAuthorized = await appointmentService.validateAppointmentAccess(
        userId,
        appointment.clientId,
        appointment.therapistId
      );
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to update this appointment' });
      }
      
      // If changing time, check for conflicts
      if (startTime && endTime && 
         (new Date(startTime).getTime() !== new Date(appointment.startTime).getTime() ||
          new Date(endTime).getTime() !== new Date(appointment.endTime).getTime())) {
        
        const hasConflict = await appointmentService.checkForConflicts(
          appointment.therapistId,
          startTime,
          endTime,
          id // Exclude this appointment from conflict check
        );
        
        if (hasConflict) {
          return res.status(409).json({ message: 'This time slot conflicts with an existing appointment' });
        }
      }
      
      // Update appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined,
          // Add canceledAt if status is being changed to CANCELED
          canceledAt: status === 'CANCELED' && appointment.status !== 'CANCELED' ? new Date() : undefined
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
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
      
      // Log update for audit
      await createAuditLog(
        userId,
        'UPDATE_APPOINTMENT',
        'Appointment',
        id,
        { updatedFields: Object.keys(req.body) }
      );
      
      res.json(updatedAppointment);
    } catch (error) {
      next(error);
    }
  },

  async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;
      const { reason } = req.body;
      
      // Get existing appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check authorization
      const isAuthorized = await appointmentService.validateAppointmentAccess(
        userId,
        appointment.clientId,
        appointment.therapistId
      );
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to cancel this appointment' });
      }
      
      // If appointment is already canceled, return early
      if (appointment.status === 'CANCELED') {
        return res.status(400).json({ message: 'Appointment is already canceled' });
      }
      
      // Update appointment
      const canceledAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelReason: reason
        }
      });
      
      // Log cancellation for audit
      await createAuditLog(
        userId,
        'CANCEL_APPOINTMENT',
        'Appointment',
        id,
        { reason }
      );
      
      res.json(canceledAppointment);
    } catch (error) {
      next(error);
    }
  },

  async getTherapistAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      const { userId, role } = req.user!;
      const { startDate, endDate, status } = req.query;
      
      // Check authorization
      if (role !== 'ADMIN') {
        // If not admin, check if user is the therapist
        const therapist = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapist || therapist.id !== therapistId) {
          return res.status(403).json({ message: 'Unauthorized to view these appointments' });
        }
      }
      
      // Build filter
      const filter: any = { therapistId };
      
      // Add date filter if present
      if (startDate || endDate) {
        filter.startTime = {};
        
        if (startDate) {
          filter.startTime.gte = new Date(startDate as string);
        }
        
        if (endDate) {
          filter.startTime.lte = new Date(endDate as string);
        }
      }
      
      // Add status filter if present
      if (status) {
        filter.status = status;
      }
      
      // Get appointments
      const appointments = await prisma.appointment.findMany({
        where: filter,
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  },

  async getClientAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { userId, role } = req.user!;
      const { startDate, endDate, status } = req.query;
      
      // Check authorization
      if (role === 'CLIENT') {
        // If client, check if user is the client
        const client = await prisma.clientProfile.findFirst({
          where: { userId }
        });
        
        if (!client || client.id !== clientId) {
          return res.status(403).json({ message: 'Unauthorized to view these appointments' });
        }
      } else if (role === 'THERAPIST') {
        // If therapist, check if client belongs to therapist
        const therapist = await prisma.therapistProfile.findFirst({
          where: { userId }
        });
        
        if (!therapist) {
          return res.status(403).json({ message: 'Therapist profile not found' });
        }
        
        const client = await prisma.clientProfile.findUnique({
          where: { id: clientId }
        });
        
        if (!client || client.therapistId !== therapist.id) {
          return res.status(403).json({ message: 'Unauthorized to view these appointments' });
        }
      }
      
      // Build filter
      const filter: any = { clientId };
      
      // Add date filter if present
      if (startDate || endDate) {
        filter.startTime = {};
        
        if (startDate) {
          filter.startTime.gte = new Date(startDate as string);
        }
        
        if (endDate) {
          filter.startTime.lte = new Date(endDate as string);
        }
      }
      
      // Add status filter if present
      if (status) {
        filter.status = status;
      }
      
      // Get appointments
      const appointments = await prisma.appointment.findMany({
        where: filter,
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
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  },

  async syncWithGoogleCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.body;
      
      // Ensure user has permission to sync this calendar
      if (req.user!.role !== 'ADMIN' && req.user!.userId !== therapistId) {
        return res.status(403).json({ message: 'Unauthorized to sync this calendar' });
      }
      
      // For testing, we'll implement a simple mock sync
      // In production, this would use the Google Calendar API
      const syncResult = await appointmentService.syncWithGoogleCalendar(therapistId);
      
      res.json(syncResult);
    } catch (error) {
      next(error);
    }
  },
  
  async connectGoogleCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId, calendarEmail, calendarId } = req.body;
      
      // Get therapist profile ID if not provided
      let effectiveTherapistId = therapistId;
      
      if (!effectiveTherapistId && req.user!.role === 'THERAPIST') {
        const therapistProfile = await prisma.therapistProfile.findFirst({
          where: { userId: req.user!.userId }
        });
        
        if (!therapistProfile) {
          return res.status(404).json({ message: 'Therapist profile not found' });
        }
        
        effectiveTherapistId = therapistProfile.id;
      }
      
      // Ensure user has permission
      if (req.user!.role !== 'ADMIN') {
        const therapist = await prisma.therapistProfile.findUnique({
          where: { id: effectiveTherapistId },
          select: { userId: true }
        });
        
        if (!therapist || therapist.userId !== req.user!.userId) {
          return res.status(403).json({ message: 'Unauthorized to connect calendar' });
        }
      }
      
      // Store calendar connection information
      const therapist = await prisma.therapistProfile.update({
        where: { id: effectiveTherapistId },
        data: {
          calendarEmail,
          calendarId
        }
      });
      
      // Log connection for audit
      await createAuditLog(
        req.user!.userId,
        'CONNECT_CALENDAR',
        'TherapistProfile',
        effectiveTherapistId,
        { calendarEmail }
      );
      
      res.json({
        success: true,
        message: 'Calendar connected successfully',
        therapist: {
          id: therapist.id,
          calendarEmail: therapist.calendarEmail,
          calendarId: therapist.calendarId
        }
      });
    } catch (error) {
      next(error);
    }
  }
};