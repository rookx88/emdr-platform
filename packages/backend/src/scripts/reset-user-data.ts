// packages/backend/src/scripts/reset-user-data.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables using the same approach as server.ts
dotenv.config({ 
  path: process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../../.env.production')
    : path.resolve(__dirname, '../../.env.development')
});

const prisma = new PrismaClient();

async function resetUserData() {
  try {
    console.log('Starting user data reset...');
    console.log('Using environment:', process.env.NODE_ENV || 'development');
    console.log('Database URL exists:', Boolean(process.env.DATABASE_URL));
    
    // 1. First, reset all user names to null
    const result = await prisma.user.updateMany({
      data: {
        firstName: null,
        lastName: null
      }
    });
    
    console.log(`Reset name data for ${result.count} users`);
    
    // 2. Optionally: keep one admin user with simple data
    await prisma.user.updateMany({
      where: {
        role: 'ADMIN'
      },
      data: {
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true
      }
    });
    
    console.log('Data reset completed successfully');
    
  } catch (error) {
    console.error('Data reset failed:', error);
    // Print more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetUserData().catch(console.error);