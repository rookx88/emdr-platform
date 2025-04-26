// packages/backend/src/scripts/init-database.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database initialization...');
  
  // Create initial admin user if it doesn't exist
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  if (!existingAdmin) {
    console.log(`Creating initial admin user: ${adminEmail}`);
    // In a real environment, you would use a more secure password
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: '$2b$12$rYpitQgcq7ACdTwFZBtVc.IM2KJw1FOtMYreoxnwHx44ZK01zJlJW', // hashed 'Admin123!' for testing only
        role: 'ADMIN',
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true
      }
    });
    
    console.log(`Admin user created with ID: ${admin.id}`);
  } else {
    console.log('Admin user already exists, skipping creation');
  }
  
  console.log('Database initialization completed successfully');
}

main()
  .catch((e) => {
    console.error('Database initialization failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });