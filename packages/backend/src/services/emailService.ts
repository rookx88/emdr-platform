// packages/backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { phiVaultService } from './encryption/phiVaultService';
import { createAuditLog } from '../utils/auditLog';

// Define templates location and map
const TEMPLATES_DIR = path.join(__dirname, '../templates/email');
const TEMPLATES = {
  CLIENT_INVITATION: 'client_invitation.html',
  APPOINTMENT_CONFIRMATION: 'appointment-confirmation.html',
  APPOINTMENT_REMINDER: 'appointment-reminder.html',
  CLIENT_WELCOME: 'client-welcome.html'
};

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Cache for compiled templates to avoid reading from disk for every email
const templateCache: Record<string, HandlebarsTemplateDelegate> = {};

// Load and compile a template
const getTemplate = (templateName: string): HandlebarsTemplateDelegate => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(templateSource);
  
  // Cache the compiled template
  templateCache[templateName] = template;
  
  return template;
};

// HIPAA compliant - sanitize email content
const sanitizeEmailContent = (content: string, userId: string): string => {
  // Remove any PHI that might have accidentally been included
  // In production, implement more sophisticated sanitization
  const sanitized = content
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED PHONE]')
    .replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[REDACTED ID]')
    .replace(/\b(0[1-9]|1[0-2])[\/](0[1-9]|[12]\d|3[01])[\/]((19|20)\d{2})\b/g, '[REDACTED DATE]');
    
  // Log this sanitization for audit purposes
  createAuditLog(
    userId,
    'EMAIL_CONTENT_SANITIZED',
    'Email',
    userId,
    { sanitizationPerformed: true }
  );
  
  return sanitized;
};

// Common function to send email with template
const sendTemplatedEmail = async (
  templateName: string,
  to: string,
  subject: string,
  context: any,
  actorId: string = 'SYSTEM'
) => {
  try {
    // Get the template
    const template = getTemplate(templateName);
    
    // Compile the HTML with data
    const html = template(context);
    
    // Create sanitized plain text version
    const text = sanitizeEmailContent(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), actorId);
    
    // Send the email
    const result = await transporter.sendMail({
      from: `"EMDR Therapy Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text
    });
    
    // Log email sending for audit
    await createAuditLog(
      actorId,
      'EMAIL_SENT',
      'Email',
      to,
      { 
        template: templateName,
        subject,
        messageId: result.messageId,
        sanitized: true
      }
    );
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send ${templateName} email:`, error);
    
    // Log failure
    await createAuditLog(
      actorId,
      'EMAIL_FAILED',
      'Email',
      to,
      { 
        template: templateName,
        subject,
        error: (error as Error).message
      }
    );
    
    throw error;
  }
};

interface ClientInvitationEmailData {
  to: string;
  clientName: string;
  inviteToken: string;
  therapistName: string;
  sessionDetails?: {
    date: string;
    time: string;
    type: string;
  } | null;
}

interface AppointmentConfirmationData {
  to: string;
  clientName: string;
  therapistName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  isVirtual: boolean;
  locationAddress?: string;
  calendarLink: string;
}

interface AppointmentReminderData {
  to: string;
  clientName: string;
  therapistName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  isVirtual: boolean;
  locationAddress?: string;
  preparationInstructions?: string;
  sessionUrl?: string;
  rescheduleUrl: string;
}

interface ClientWelcomeData {
  to: string;
  clientName: string;
  therapistName: string;
  loginUrl: string;
  upcomingAppointment?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  resourcesUrl: string;
  supportEmail: string;
}

export const emailService = {
  // Send client invitation email
  async sendClientInvitation(data: ClientInvitationEmailData) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite/${data.inviteToken}`;
    
    // Prepare context for template
    const context = {
      clientName: data.clientName,
      therapistName: data.therapistName,
      inviteUrl,
      hasSession: !!data.sessionDetails,
      sessionDate: data.sessionDetails?.date,
      sessionTime: data.sessionDetails?.time,
      sessionType: data.sessionDetails?.type
    };
    
    return sendTemplatedEmail(
      TEMPLATES.CLIENT_INVITATION,
      data.to,
      'Welcome to EMDR Therapy Platform - Complete Your Registration',
      context
    );
  },
  
  // Send appointment confirmation email
  async sendAppointmentConfirmation(data: AppointmentConfirmationData) {
    return sendTemplatedEmail(
      TEMPLATES.APPOINTMENT_CONFIRMATION,
      data.to,
      'Your Appointment Confirmation',
      data
    );
  },
  
  // Send appointment reminder email
  async sendAppointmentReminder(data: AppointmentReminderData) {
    return sendTemplatedEmail(
      TEMPLATES.APPOINTMENT_REMINDER,
      data.to,
      'Reminder: Your Upcoming Therapy Session',
      data
    );
  },
  
  // Send welcome email to client after registration
  async sendClientWelcome(data: ClientWelcomeData) {
    return sendTemplatedEmail(
      TEMPLATES.CLIENT_WELCOME,
      data.to,
      'Welcome to Your EMDR Therapy Journey',
      data
    );
  }
};

export default emailService;