import axios from 'axios';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { phiVaultService } from './encryption/phiVaultService';
import { createAuditLog } from '../utils/auditLog';
import { emailDraftService } from './emailDraftService';

export interface InsuranceInfo {
  fullName: string;
  dateOfBirth: string;
  insuranceProvider: string;
  memberId: string;
  groupNumber?: string;
  cardFrontImage?: string;
  cardBackImage?: string;
  gmailToken?: string;
  outlookToken?: string;
}

export interface VerificationResult {
  active: boolean;
  deductibleRemaining?: number | null;
  copay?: number | null;
  coinsurance?: number | null;
  allowedVisits?: number | null;
  telehealthCovered?: boolean | null;
  preAuthRequired?: boolean | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  draftId?: string | null;
  mailtoLink?: string | null;
  summary: string;
  raw: any;
  changes?: Record<string, any> | null;
}

const CLEARINGHOUSE_URL = process.env.CLEARINGHOUSE_URL || '';
const CLEARINGHOUSE_API_KEY = process.env.CLEARINGHOUSE_API_KEY || '';

export interface ContactInfo {
  email?: string | null;
  phone?: string | null;
}

export function extractContactInfo(raw271: string): ContactInfo {
  const emailMatch = raw271.match(/PER\*[^*]*\*[^*]*\*(?:TE\*[^*~]+)?\*EM\*([^*~]+)/);
  const phoneMatch = raw271.match(/PER\*[^*]*\*[^*]*\*TE\*([0-9]+)/);
  return {
    email: emailMatch ? emailMatch[1] : null,
    phone: phoneMatch ? phoneMatch[1] : null
  };
}

async function callClearinghouse(info: InsuranceInfo): Promise<any> {
  // In a real implementation, this would send a 270 request and parse the 271 response.
  // Here we mock the response for offline development.
  try {
    if (!CLEARINGHOUSE_URL) {
      // Mocked sample response
      return {
        active: true,
        deductibleRemaining: 300,
        copay: 20,
        coinsurance: 0.2,
        allowedVisits: 20,
        preAuthRequired: false,
        telehealthCovered: true
      };
    }
    const response = await axios.post(
      `${CLEARINGHOUSE_URL}/eligibility`,
      info,
      {
        headers: {
          'x-api-key': CLEARINGHOUSE_API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Clearinghouse request failed');
  }
}

function buildSummary(result: VerificationResult): string {
  const parts: string[] = [];
  if (result.active) {
    parts.push('Client is covered');
  } else {
    parts.push('Client is not currently covered');
  }

  if (result.telehealthCovered) {
    parts.push('for telehealth psychotherapy');
  } else {
    parts.push('for psychotherapy (telehealth uncertain)');
  }

  if (result.copay != null) {
    parts.push(`$${result.copay} copay`);
  }
  if (result.deductibleRemaining != null) {
    parts.push(`${result.deductibleRemaining} deductible remaining`);
  }
  if (result.allowedVisits != null) {
    parts.push(`${result.allowedVisits} visits/year`);
  }
  if (result.preAuthRequired) {
    parts.push('pre-auth required');
  } else {
    parts.push('no pre-auth required');
  }
  return parts.join('. ') + '.';
}

export const insuranceVerificationService = {
  async verify(clientId: string, userId: string, info: InsuranceInfo): Promise<VerificationResult> {
    // Limit checks to once every 30 days unless overridden
    const last = await prisma.insuranceVerification.findFirst({
      where: { clientId },
      orderBy: { createdAt: 'desc' }
    });
  const now = new Date();
    if (last && now.getTime() - last.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30) {
      return {
        active: last.status === 'ACTIVE',
        deductibleRemaining: last.deductibleRemaining,
        copay: last.copay,
        coinsurance: last.coinsurance,
        allowedVisits: last.allowedVisits,
        telehealthCovered: last.telehealthCovered,
        preAuthRequired: last.preAuthRequired,
        contactEmail: (last.rawResponse as any)?.contactEmail ?? null,
        contactPhone: (last.rawResponse as any)?.contactPhone ?? null,
        draftId: null,
        mailtoLink: null,
        summary: buildSummary({
          active: last.status === 'ACTIVE',
          deductibleRemaining: last.deductibleRemaining,
          copay: last.copay,
          coinsurance: last.coinsurance,
          allowedVisits: last.allowedVisits,
          telehealthCovered: last.telehealthCovered,
          preAuthRequired: last.preAuthRequired,
          raw: last.rawResponse,
          summary: ''
        }),
        raw: last.rawResponse,
        changes: null
      };
    }

    const response = await callClearinghouse(info);
    const rawStr = typeof response === 'string' ? response : JSON.stringify(response);
    const contactInfo = extractContactInfo(rawStr);

    const result: VerificationResult = {
      active: !!response.active,
      deductibleRemaining: response.deductibleRemaining ?? null,
      copay: response.copay ?? null,
      coinsurance: response.coinsurance ?? null,
      allowedVisits: response.allowedVisits ?? null,
      telehealthCovered: response.telehealthCovered ?? null,
      preAuthRequired: response.preAuthRequired ?? null,
      contactEmail: contactInfo.email ?? null,
      contactPhone: contactInfo.phone ?? null,
      draftId: null,
      mailtoLink: null,
      summary: '',
      raw: response,
      changes: null
    };

    const incomplete =
      result.telehealthCovered === null || result.allowedVisits === null;
    if (incomplete && (contactInfo.email || contactInfo.phone)) {
      const draft = await emailDraftService.createDraft({
        to: contactInfo.email || 'unknown@example.com',
        subject: 'Coverage confirmation request',
        body: `Hello,\n\nPlease confirm mental health and telehealth coverage for Member ID ${info.memberId} (DOB ${info.dateOfBirth}).\n\nTherapist NPI: \n`,
        gmailToken: (info as any).gmailToken,
        outlookToken: (info as any).outlookToken
      });
      result.draftId = draft.id ?? null;
      result.mailtoLink = draft.mailto ?? null;
    }

    const changes: Record<string, any> = {};
    if (last) {
      for (const key of ['status','deductibleRemaining','copay','coinsurance','allowedVisits','telehealthCovered','preAuthRequired']) {
        const newVal = (result as any)[key] ?? null;
        const oldVal = (last as any)[key] ?? null;
        if (newVal !== oldVal) {
          changes[key] = { old: oldVal, new: newVal };
        }
      }
    }
    result.changes = Object.keys(changes).length > 0 ? changes : null;
    result.summary = buildSummary(result);

    await prisma.insuranceVerification.create({
      data: {
        clientId,
        verifiedBy: userId,
        status: result.active ? 'ACTIVE' : 'INACTIVE',
        deductibleRemaining: result.deductibleRemaining ?? null,
        copay: result.copay ?? null,
        coinsurance: result.coinsurance ?? null,
        allowedVisits: result.allowedVisits ?? null,
        telehealthCovered: result.telehealthCovered ?? null,
        preAuthRequired: result.preAuthRequired ?? null,
        rawResponse: result.raw as Prisma.InputJsonValue,
        changes: result.changes as Prisma.InputJsonValue | null
      }
    });

    await createAuditLog(userId, 'VERIFY_INSURANCE', 'ClientProfile', clientId, result);

    return result;
  },

  async storeInsurancePHI(clientId: string, userId: string, info: InsuranceInfo) {
    // Store sensitive fields in PHI vault
    await phiVaultService.storePHI(userId, info.fullName, 'NAME', userId);
    await phiVaultService.storePHI(userId, info.memberId, 'INSURANCE_ID', userId);
    if (info.groupNumber) {
      await phiVaultService.storePHI(userId, info.groupNumber, 'GROUP_ID', userId);
    }
    if (info.cardFrontImage) {
      await phiVaultService.storePHI(userId, info.cardFrontImage, 'INSURANCE_CARD_FRONT', userId);
    }
    if (info.cardBackImage) {
      await phiVaultService.storePHI(userId, info.cardBackImage, 'INSURANCE_CARD_BACK', userId);
    }
  }
};
