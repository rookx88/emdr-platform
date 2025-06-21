import { insuranceVerificationService, extractContactInfo } from '../services/insuranceVerificationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.insuranceVerification.deleteMany({});
});

afterAll(async () => {
  await prisma.insuranceVerification.deleteMany({});
  await prisma.$disconnect();
});

describe('Insurance Verification Service', () => {
  test('should verify insurance with mocked response', async () => {
    const result = await insuranceVerificationService.verify('test-client', 'tester', {
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      insuranceProvider: 'Mock',
      memberId: '12345'
    });
    expect(result).toBeDefined();
    expect(result.summary).toContain('Client is covered');
  });

  test('extracts contact info from 271', () => {
    const sample = 'PER*IC*CUSTOMER SERVICE*TE*8005551212*EM*support@payer.com~';
    const info = extractContactInfo(sample);
    expect(info.email).toBe('support@payer.com');
    expect(info.phone).toBe('8005551212');
  });
});
