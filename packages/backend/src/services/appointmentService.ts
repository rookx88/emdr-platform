import { PrismaClient, Appointment, AppointmentStatus, AppointmentType } from '@prisma/client';
import { createAuditLog } from '../utils/auditLog';

const prisma = new PrismaClient();

// Types for appointment creation
interface CreateAppointmentData {
  title: string;
  clientId: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  isVirtual?: boolean;
}

export const appointmentService = {
  /**
   * Validates if a user has access to create/modify an appointment
   */
  async validateAppointmentAccess(
    userId: string,
    clientId: string,
    therapistId: string
  ): Promise<boolean> {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) return false;

    // Admins have access to all appointments
    if (user.role === 'ADMIN') return true;

    // Therapists can only manage their own appointments
    if (user.role === 'THERAPIST') {
      const therapist = await prisma.therapistProfile.findFirst({
        where: { userId }
      });
      
      return therapist?.id === therapistId;
    }

    // Clients can only manage their own appointments
    if (user.role === 'CLIENT') {
      const client = await prisma.clientProfile.findFirst({
        where: { userId }
      });
      
      return client?.id === clientId;
    }

    return false;
  },

  /**
   * Checks if a proposed appointment conflicts with existing appointments
   */
  async checkForConflicts(
    therapistId: string,
    startTime: string | Date,
    endTime: string | Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Build filter
    const filter: any = {
      therapistId,
      status: { notIn: ['CANCELED'] },
      OR: [
        // Case 1: New appointment starts during an existing appointment
        {
          startTime: { lte: start },
          endTime: { gt: start }
        },
        // Case 2: New appointment ends during an existing appointment
        {
          startTime: { lt: end },
          endTime: { gte: end }
        },
        // Case 3: New appointment completely contains an existing appointment
        {
          startTime: { gte: start },
          endTime: { lte: end }
        }
      ]
    };
    
    // Exclude the appointment we're updating if provided
    if (excludeAppointmentId) {
      filter.id = { not: excludeAppointmentId };
    }

    // Check for existing appointments that overlap
    const conflictingAppointments = await prisma.appointment.findMany({
      where: filter
    });

    return conflictingAppointments.length > 0;
  },

  /**
   * Creates a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return prisma.appointment.create({
      data
    });
  },

  /**
   * Gets appointments for a specific user based on their role
   */
  async getAppointmentsForUser(
    userId: string,
    userRole: string,
    filter: any = {}
  ): Promise<Appointment[]> {
    // Initialize with proper type
    let appointments: Appointment[] = [];

    if (userRole === 'ADMIN') {
      // Admins can see all appointments
      appointments = await prisma.appointment.findMany({
        where: filter,
        include: {
          client: {
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
          },
          therapist: {
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
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });
    } else if (userRole === 'THERAPIST') {
      // Find therapist profile
      const therapist = await prisma.therapistProfile.findFirst({
        where: { userId }
      });

      if (therapist) {
        // Get appointments where this user is the therapist
        appointments = await prisma.appointment.findMany({
          where: {
            therapistId: therapist.id,
            ...filter
          },
          include: {
            client: {
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
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        });
      }
    } else if (userRole === 'CLIENT') {
      // Find client profile
      const client = await prisma.clientProfile.findFirst({
        where: { userId }
      });

      if (client) {
        // Get appointments where this user is the client
        appointments = await prisma.appointment.findMany({
          where: {
            clientId: client.id,
            ...filter
          },
          include: {
            therapist: {
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
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        });
      }
    }

    return appointments;
  },

  /**
   * Mock implementation for Google Calendar sync
   * In production, this would use the Google Calendar API
   */
  async syncWithGoogleCalendar(therapistId: string) {
    // Get therapist profile with calendar info
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        calendarEmail: true,
        calendarId: true,
        userId: true
      }
    });

    if (!therapist || !therapist.calendarEmail) {
      throw new Error('Therapist calendar not configured');
    }

    // Get appointments that need to be synced
    const appointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        externalCalendarEventId: null,
        status: { not: 'CANCELED' }
      }
    });

    // For now, just update with mock external IDs
    // In production, we would create these in Google Calendar
    const updatedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const mockEventId = `google_${Date.now()}_${appointment.id}`;
        
        return prisma.appointment.update({
          where: { id: appointment.id },
          data: { externalCalendarEventId: mockEventId }
        });
      })
    );

    // Log sync for audit
    await createAuditLog(
      therapist.userId,
      'SYNC_CALENDAR',
      'TherapistProfile',
      therapistId,
      { 
        appointmentsSynced: updatedAppointments.length,
        calendarEmail: therapist.calendarEmail 
      }
    );

    return {
      success: true,
      appointmentsSynced: updatedAppointments.length,
      calendarEmail: therapist.calendarEmail
    };
  }
};