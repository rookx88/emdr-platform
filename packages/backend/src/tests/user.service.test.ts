// packages/backend/src/tests/user.service.test.ts
import { userService } from '../services/userService';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create a test client outside the test suite to reuse
const prisma = new PrismaClient();

// Force test environment to avoid encryption/decryption issues
process.env.NODE_ENV = 'test';

// Clean up before all tests
beforeAll(async () => {
  jest.setTimeout(10000); // Increase timeout for database operations
  
  // Clean up the database before tests
  await prisma.passwordHistory.deleteMany({});
  await prisma.user.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  // Clean up and disconnect
  await prisma.passwordHistory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe('User Service', () => {
  test('should create a new user', async () => {
    const user = await userService.createUser(
      'test@example.com',
      'Password123!',
      Role.THERAPIST,
      'Test',
      'User'
    );
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('Test');
    expect(user.lastName).toBe('User');
    expect(user.role).toBe(Role.THERAPIST);
    
    // Password should be hashed
    expect(user.passwordHash).not.toBe('Password123!');
    const passwordValid = await bcrypt.compare('Password123!', user.passwordHash);
    expect(passwordValid).toBe(true);
  });
  
  test('should find a user by email', async () => {
    const user = await userService.findUserByEmail('test@example.com');
    
    expect(user).toBeDefined();
    expect(user?.email).toBe('test@example.com');
  });
  
  test('should update a user', async () => {
    const user = await userService.findUserByEmail('test@example.com');
    if (!user) throw new Error('User not found');
    
    const updatedUser = await userService.updateUser(user.id, {
      firstName: 'Updated',
      lastName: 'Name'
    });
    
    expect(updatedUser.firstName).toBe('Updated');
    expect(updatedUser.lastName).toBe('Name');
  });
  
  test('should update password', async () => {
    const user = await userService.findUserByEmail('test@example.com');
    if (!user) throw new Error('User not found');
    
    const initialPasswordHash = user.passwordHash;
    
    const updatedUser = await userService.updatePassword(user.id, 'NewPassword123!');
    
    expect(updatedUser.passwordHash).not.toBe(initialPasswordHash);
    
    const passwordValid = await bcrypt.compare('NewPassword123!', updatedUser.passwordHash);
    expect(passwordValid).toBe(true);
  });
});