#!/bin/bash
# EMDR Platform Project Initialization Script
# This script sets up the initial project structure and installs dependencies

set -e # Exit on any error

echo "Creating EMDR Platform project structure..."

# Create project root directory
mkdir -p emdr-platform
cd emdr-platform

# Initialize git repository
git init
echo "node_modules" > .gitignore
echo "dist" >> .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
echo "coverage" >> .gitignore
echo ".DS_Store" >> .gitignore

# Create package directories
mkdir -p packages/{backend,frontend,common,infrastructure}
mkdir -p docs scripts

# Create example environment files
cat > .env.example << EOL
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/emdr_dev
DATABASE_ENCRYPTION_KEY=local_dev_key_replace_in_production

# JWT Auth
JWT_SECRET=local_dev_secret_replace_in_production
JWT_EXPIRY=8h

# API Configuration
API_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Security
ENABLE_RATE_LIMITING=false
EOL

cp .env.example .env.development

# Create docker-compose file
cat > docker-compose.yml << EOL
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: emdr_dev
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
EOL

# Initialize backend
cd packages/backend
npm init -y
npm install express typescript ts-node @types/node @types/express prisma @prisma/client dotenv cors helmet jsonwebtoken bcrypt express-rate-limit
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint jest ts-jest @types/jest supertest nodemon

# Initialize TypeScript
npx tsc --init --target es2022 --module commonjs --strict true --esModuleInterop true --outDir dist

# Initialize Prisma
npx prisma init

# Create basic Prisma schema
cat > prisma/schema.prisma << EOL
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  role          Role      @default(CLIENT)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  @@index([email])
}

enum Role {
  ADMIN
  THERAPIST
  CLIENT
}
EOL

# Create basic server structure
mkdir -p src/{controllers,services,middlewares,utils,routes,config,types}

# Create a basic server file
cat > src/server.ts << EOL
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

const app = express();
const PORT = process.env.API_PORT || 4000;

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting for security
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;
EOL

# Create error handler middleware
mkdir -p src/middlewares
cat > src/middlewares/errorHandler.ts << EOL
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  // Log error
  console.error(\`[\${new Date().toISOString()}] \${err.stack}\`);
  
  // Hide error details in production for non-operational errors
  const message = process.env.NODE_ENV === 'production' && !isOperational
    ? 'Internal server error'
    : err.message;
    
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
EOL

# Create package.json scripts
npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.test="jest"
npm pkg set scripts.lint="eslint . --ext .ts"

# Initialize frontend
cd ../frontend
npx create-react-app . --template typescript

# Add husky for git hooks
cd ../..
npm install -D husky lint-staged

# Initialize husky
npx husky install
npm pkg set scripts.prepare="husky install"

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create lint-staged config
cat > lint-staged.config.js << EOL
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
};
EOL

echo "Project initialization completed! Ready to start development."
echo "To start the development environment:"
echo "1. Start database: docker-compose up -d"
echo "2. Set up database schema: cd packages/backend && npx prisma migrate dev --name init"
echo "3. Start backend: npm run dev"
echo "4. Start frontend: cd ../frontend && npm start"