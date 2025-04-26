// src/types/prismaTypes.ts
import { User } from '@prisma/client';

// Only needed if types are still missing after schema update
export interface UserWithHIPAA extends User {
  failedLoginAttempts: number;
  lastFailedLogin: Date | null;
  lockedAt: Date | null;
  lockedReason: string | null;
}