// packages/backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma
export const prisma = new PrismaClient();