// packages/backend/src/services/userService.ts
import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const userService = {
  async createUser(email: string, password: string, role: Role, firstName?: string, lastName?: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        firstName,
        lastName
      }
    });
  },
  
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  },
  
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  },
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    // Ensure we never update these fields directly
    const { id: _, passwordHash: __, createdAt: ___, ...updateData } = data;
    
    return prisma.user.update({
      where: { id },
      data: updateData
    });
  },
  
  async updatePassword(id: string, newPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    return prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }
};