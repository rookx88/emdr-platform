import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const magicCodeService = {
  async generateCode(email: string, userId?: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await prisma.magicCode.create({
      data: { code, email, userId: userId || null, expiresAt }
    });
    return code;
  },

  async verifyCode(email: string, code: string) {
    const entry = await prisma.magicCode.findFirst({
      where: { email, code, usedAt: null, expiresAt: { gt: new Date() } }
    });
    if (!entry) return { valid: false };
    await prisma.magicCode.update({
      where: { id: entry.id },
      data: { usedAt: new Date() }
    });
    return { valid: true, userId: entry.userId };
  }
};
