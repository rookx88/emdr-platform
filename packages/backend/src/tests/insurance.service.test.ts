import { insuranceVerificationService } from '../services/insuranceVerificationService';
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
});
