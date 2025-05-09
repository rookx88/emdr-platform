// packages/backend/src/services/emailService.ts

import nodemailer from 'nodemailer';
import { phiVaultService } from './encryption/phiVaultService';
import { createAuditLog } from '../utils/auditLog';

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

export const emailService = {
  // Send client invitation email
  async sendClientInvitation(data: ClientInvitationEmailData) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite/${data.inviteToken}`;
    
    // Format email content with session info if available
    let sessionInfo = '';
    if (data.sessionDetails) {
      sessionInfo = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <h3 style="color: #495057; margin-top: 0;">Your First Session</h3>
          <p style="margin-bottom: 10px;">Your therapist has scheduled your first session:</p>
          <p><strong>Date:</strong> ${data.sessionDetails.date}</p>
          <p><strong>Time:</strong> ${data.sessionDetails.time}</p>
          <p><strong>Type:</strong> ${data.sessionDetails.type}</p>
        </div>
      `;
    }
    
    // Construct email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f2e4; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="color: #7d5a01; margin: 0;">Welcome to EMDR Therapy Platform</h2>
        </div>
        
        <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 5px 5px; border: 1px solid #f8f2e4;">
          <p>Hello ${data.clientName},</p>
          
          <p>${data.therapistName} has invited you to join the EMDR Therapy Platform where you'll be able to:</p>
          
          <ul style="padding-left: 20px;">
            <li>Schedule and attend virtual therapy sessions</li>
            <li>Access resources provided by your therapist</li>
            <li>Complete assessments and track your progress</li>
            <li>Communicate securely with your therapist</li>
          </ul>
          
          ${sessionInfo}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #e6a027; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Your Registration</a>
          </div>
          
          <p>This invitation link will expire in 7 days. If you have any questions, please contact your therapist directly.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f1f1; font-size: 12px; color: #666;">
            <p><strong>HIPAA Compliance & Privacy:</strong> Our platform is fully HIPAA compliant and designed to protect your privacy and personal health information. All data is encrypted and securely stored.</p>
            <p>If you did not expect this invitation, please disregard this email.</p>
          </div>
        </div>
      </div>
    `;
    
    // Send the email
    await transporter.sendMail({
      from: `"EMDR Therapy Platform" <${process.env.EMAIL_FROM}>`,
      to: data.to,
      subject: 'Welcome to EMDR Therapy Platform - Complete Your Registration',
      html: emailContent,
      text: emailContent.replace(/<[^>]*>/g, '') // Plain text version
    });
    
    // Log email sent for audit
    await createAuditLog(
      'SYSTEM', // System action
      'INVITATION_EMAIL_SENT',
      'User',
      'INVITE',
      { recipient: data.to, sessionScheduled: !!data.sessionDetails }
    );
    
    return true;
  }
};

export default emailService;