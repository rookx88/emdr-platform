// packages/backend/src/services/emailDraftService.ts
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';

export interface EmailDraftOptions {
  to: string;
  subject: string;
  body: string;
  gmailToken?: string;
  outlookToken?: string;
}

export const emailDraftService = {
  async createDraft(options: EmailDraftOptions): Promise<{ id?: string; mailto?: string }> {
    if (options.gmailToken) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: options.gmailToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const raw = Buffer.from(
        `To: ${options.to}\r\nSubject: ${options.subject}\r\n\r\n${options.body}`
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const res = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: { message: { raw } }
      });
      return { id: res.data.id ?? undefined };
    }

    if (options.outlookToken) {
      const client = Client.init({
        authProvider: (done) => done(null, options.outlookToken as string)
      });
      const message = {
        subject: options.subject,
        body: {
          contentType: 'Text',
          content: options.body
        },
        toRecipients: [{ emailAddress: { address: options.to } }]
      };
      const res = await client.api('/me/messages').post(message);
      return { id: res.id };
    }

    const mailto = `mailto:${options.to}?subject=${encodeURIComponent(
      options.subject
    )}&body=${encodeURIComponent(options.body)}`;
    return { mailto };
  }
};
