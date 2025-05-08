#!/bin/bash
# EMDR Platform Security Architecture Implementation Script
# This script sets up the security architecture for the EMDR Platform

set -e # Exit on any error

echo "Setting up EMDR Platform Security Architecture..."

# Create security directories if they don't exist
mkdir -p packages/security
mkdir -p packages/encryption
mkdir -p packages/backend/src/middleware/security
mkdir -p packages/backend/src/services/encryption
mkdir -p packages/backend/src/utils/phi

# Create PHI Vault service
cat > packages/backend/src/services/encryption/phiVaultService.ts << 'EOL'
// PHI Vault Service - Handles encryption and tokenization of Protected Health Information
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../utils/auditLog';

// Encryption key from environment (in production, use a proper key management system)
const ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || 'local_dev_key_replace_in_production';

// Create a deterministic but secure ID for PHI that preserves relationships
const generateTokenForPHI = (phiData: string, userId: string): string => {
  const hmac = crypto.createHmac('sha256', ENCRYPTION_KEY);
  hmac.update(`${userId}:${phiData}`);
  return hmac.digest('hex');
};

// Encrypt sensitive PHI data
const encryptPHI = (text: string): string => {
  if (!text) return text;
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher using the encryption key and iv
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
    iv
  );
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv and encrypted data
  return `${iv.toString('hex')}:${encrypted}`;
};

// Decrypt PHI data
const decryptPHI = (encryptedText: string): string => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  // Split the iv and encrypted text
  const [ivHex, encrypted] = encryptedText.split(':');
  
  // Convert iv from hex to Buffer
  const iv = Buffer.from(ivHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  
  // Decrypt the text
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Check if text is already encrypted
const isEncrypted = (text: string): boolean => {
  return Boolean(text && typeof text === 'string' && /^[0-9a-f]{32}:.+$/i.test(text));
};

// Store PHI with encryption and return token
const storePHI = async (
  userId: string,
  phiData: string,
  phiType: string,
  actorId: string
): Promise<string> => {
  // Generate token for this PHI
  const token = generateTokenForPHI(phiData, userId);
  
  // Encrypt the PHI data
  const encryptedData = encryptPHI(phiData);
  
  // Store in database
  await prisma.protectedHealthInfo.upsert({
    where: { token },
    update: { 
      encryptedData,
      lastAccessed: new Date()
    },
    create: {
      token,
      userId,
      phiType,
      encryptedData,
      createdAt: new Date(),
      lastAccessed: new Date()
    }
  });
  
  // Log access for audit
  await createAuditLog(
    actorId,
    'STORE_PHI',
    'ProtectedHealthInfo',
    token,
    { phiType }
  );
  
  return token;
};

// Retrieve PHI using token
const retrievePHI = async (
  token: string,
  actorId: string,
  purpose: string
): Promise<string | null> => {
  // Find PHI entry
  const phiEntry = await prisma.protectedHealthInfo.findUnique({
    where: { token }
  });
  
  if (!phiEntry) return null;
  
  // Log access for audit
  await createAuditLog(
    actorId,
    'ACCESS_PHI',
    'ProtectedHealthInfo',
    token,
    { purpose }
  );
  
  // Update last accessed timestamp
  await prisma.protectedHealthInfo.update({
    where: { token },
    data: { lastAccessed: new Date() }
  });
  
  // Decrypt and return the PHI
  return decryptPHI(phiEntry.encryptedData);
};

// Replace PHI in text with tokens
const tokenizePHIInText = async (
  text: string,
  userId: string,
  actorId: string
): Promise<string> => {
  if (!text) return text;
  
  // Simple PHI detection patterns (in production, use more sophisticated NLP)
  const patterns = [
    // US Phone numbers
    { 
      regex: /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/g, 
      type: 'PHONE_NUMBER' 
    },
    // SSN
    { 
      regex: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, 
      type: 'SSN' 
    },
    // Email addresses
    { 
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
      type: 'EMAIL' 
    },
    // Dates of birth
    { 
      regex: /\b(0[1-9]|1[0-2])[\/](0[1-9]|[12]\d|3[01])[\/]((19|20)\d{2})\b/g, 
      type: 'DOB' 
    },
    // Addresses (simplified)
    { 
      regex: /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|court|ct|lane|ln|way|parkway|pkwy)\b/gi, 
      type: 'ADDRESS' 
    }
  ];
  
  let tokenizedText = text;
  
  // Process each pattern
  for (const pattern of patterns) {
    tokenizedText = await tokenizedText.replace(pattern.regex, async (match) => {
      // Store PHI and get token
      const token = await storePHI(userId, match, pattern.type, actorId);
      return `[PHI:${token}]`;
    });
  }
  
  return tokenizedText;
};

// Replace tokens in text with actual PHI
const detokenizePHIInText = async (
  tokenizedText: string,
  actorId: string,
  purpose: string
): Promise<string> => {
  if (!tokenizedText) return tokenizedText;
  
  const tokenPattern = /\[PHI:([a-f0-9]{64})\]/gi;
  let detokenizedText = tokenizedText;
  const tokens = tokenizedText.match(tokenPattern) || [];
  
  for (const tokenMatch of tokens) {
    const token = tokenMatch.match(/\[PHI:([a-f0-9]{64})\]/i)?.[1];
    if (token) {
      const phiValue = await retrievePHI(token, actorId, purpose);
      if (phiValue) {
        detokenizedText = detokenizedText.replace(`[PHI:${token}]`, phiValue);
      }
    }
  }
  
  return detokenizedText;
};

export const phiVaultService = {
  encryptPHI,
  decryptPHI,
  isEncrypted,
  storePHI,
  retrievePHI,
  tokenizePHIInText,
  detokenizePHIInText
};
EOL

# Create PHI detection middleware
cat > packages/backend/src/middleware/security/phiDetectionMiddleware.ts << 'EOL'
// PHI Detection Middleware
import { Request, Response, NextFunction } from 'express';
import { phiVaultService } from '../../services/encryption/phiVaultService';

export const phiDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip for certain endpoints that don't need PHI detection
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/health',
      // Add other paths that don't need PHI detection
    ];
    
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Only process if user is authenticated
    if (!req.user) {
      return next();
    }
    
    // Process request body if it exists and is JSON
    if (req.body && typeof req.body === 'object') {
      // Create a deep copy of the request body
      const processedBody = JSON.parse(JSON.stringify(req.body));
      
      // Process specific fields that might contain PHI
      const sensitiveFields = ['notes', 'content', 'message', 'description'];
      
      // Process each field recursively
      const processObject = async (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && sensitiveFields.includes(key)) {
            // Tokenize PHI in text content
            obj[key] = await phiVaultService.tokenizePHIInText(
              obj[key],
              req.user.userId,
              req.user.userId
            );
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively process nested objects
            await processObject(obj[key]);
          }
        }
      };
      
      await processObject(processedBody);
      
      // Replace the request body with the processed version
      req.body = processedBody;
    }
    
    next();
  } catch (error) {
    console.error('Error in PHI detection middleware:', error);
    next(error);
  }
};
EOL

# Create security scan utility
cat > packages/backend/src/utils/phi/securityScan.ts << 'EOL'
// Security Scan Utility for PHI
import { PrismaClient } from '@prisma/client';
import { phiVaultService } from '../../services/encryption/phiVaultService';
import { createAuditLog } from '../auditLog';

const prisma = new PrismaClient();

// Fields that should be encrypted
const sensitiveFields = [
  { model: 'User', fields: ['firstName', 'lastName'] },
  { model: 'ClientProfile', fields: ['dateOfBirth', 'address', 'phoneNumber', 'emergencyContact', 'emergencyPhone'] },
  { model: 'Note', fields: ['content'] },
  // Add other models and fields as needed
];

// Scan the database for unencrypted PHI
export const scanForUnencryptedPHI = async (adminUserId: string) => {
  console.log('Starting PHI security scan...');
  const results: any = {};
  
  // Create scan record
  const scan = await prisma.securityScan.create({
    data: {
      scanType: 'PHI_ENCRYPTION',
      startedBy: adminUserId,
      startedAt: new Date(),
      status: 'IN_PROGRESS',
    }
  });
  
  // Log scan start
  await createAuditLog(
    adminUserId,
    'START_SECURITY_SCAN',
    'SecurityScan',
    scan.id,
    { scanType: 'PHI_ENCRYPTION' }
  );
  
  // Check each model and field
  for (const { model, fields } of sensitiveFields) {
    results[model] = { checked: 0, unencrypted: 0, records: [] };
    
    // Get the Prisma model dynamically
    const prismaModel = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
    
    if (!prismaModel) {
      console.warn(`Model ${model} not found in Prisma client`);
      continue;
    }
    
    // Get all records
    const records = await prismaModel.findMany();
    results[model].checked = records.length;
    
    // Check each record
    for (const record of records) {
      let hasUnencryptedField = false;
      const unencryptedFields: string[] = [];
      
      // Check each sensitive field
      for (const field of fields) {
        if (record[field] && !phiVaultService.isEncrypted(record[field])) {
          hasUnencryptedField = true;
          unencryptedFields.push(field);
        }
      }
      
      // Add to results if unencrypted fields found
      if (hasUnencryptedField) {
        results[model].unencrypted++;
        results[model].records.push({
          id: record.id,
          fields: unencryptedFields
        });
      }
    }
  }
  
  // Update scan record with results
  await prisma.securityScan.update({
    where: { id: scan.id },
    data: {
      completedAt: new Date(),
      status: 'COMPLETED',
      findings: results
    }
  });
  
  // Log scan completion
  await createAuditLog(
    adminUserId,
    'COMPLETE_SECURITY_SCAN',
    'SecurityScan',
    scan.id,
    { findings: JSON.stringify(results) }
  );
  
  console.log('PHI security scan completed');
  return results;
};

// Encrypt all unencrypted PHI found in the scan
export const encryptUnencryptedPHI = async (scanId: string, adminUserId: string) => {
  console.log('Starting encryption of unencrypted PHI...');
  
  // Get scan results
  const scan = await prisma.securityScan.findUnique({
    where: { id: scanId }
  });
  
  if (!scan || scan.status !== 'COMPLETED') {
    throw new Error('Invalid scan ID or scan not completed');
  }
  
  const findings = scan.findings as any;
  const results: any = {};
  
  // Process each model
  for (const model of Object.keys(findings)) {
    results[model] = { processed: 0, encrypted: 0 };
    
    // Get the Prisma model dynamically
    const prismaModel = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
    
    if (!prismaModel) {
      console.warn(`Model ${model} not found in Prisma client`);
      continue;
    }
    
    // Process each record with unencrypted fields
    for (const record of findings[model].records) {
      results[model].processed++;
      
      // Get the current state of the record
      const currentRecord = await prismaModel.findUnique({
        where: { id: record.id }
      });
      
      if (!currentRecord) continue;
      
      // Prepare update data
      const updateData: any = {};
      
      // Encrypt each unencrypted field
      for (const field of record.fields) {
        if (currentRecord[field] && !phiVaultService.isEncrypted(currentRecord[field])) {
          updateData[field] = phiVaultService.encryptPHI(currentRecord[field]);
        }
      }
      
      // Update the record if there are fields to encrypt
      if (Object.keys(updateData).length > 0) {
        await prismaModel.update({
          where: { id: record.id },
          data: updateData
        });
        
        results[model].encrypted++;
      }
    }
  }
  
  // Log encryption completion
  await createAuditLog(
    adminUserId,
    'ENCRYPT_UNENCRYPTED_PHI',
    'SecurityScan',
    scanId,
    { results: JSON.stringify(results) }
  );
  
  console.log('Encryption of unencrypted PHI completed');
  return results;
};
EOL

# Create security middleware
cat > packages/backend/src/middleware/security/securityHeadersMiddleware.ts << 'EOL'
// Enhanced Security Headers Middleware
import { Request, Response, NextFunction } from 'express';

export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set strict Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " + 
    "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for UI frameworks
    "img-src 'self' data:; " + 
    "font-src 'self'; " + 
    "connect-src 'self'; " + 
    "media-src 'self'; " + 
    "object-src 'none'; " + 
    "frame-ancestors 'none'; " + 
    "form-action 'self'; " + 
    "base-uri 'self';"
  );
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable the XSS filter in the browser
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Restrict referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Disable browser features
  res.setHeader('Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), serial=()'
  );
  
  // Add HIPAA compliance header
  res.setHeader('X-HIPAA-Compliance', 'PHI-Protected');
  
  next();
};
EOL

# Update Prisma schema to add PHI handling tables
cat > packages/backend/prisma/migrations/$(date +%Y%m%d%H%M%S)_add_phi_protection_tables.sql << 'EOL'
-- CreateTable
CREATE TABLE "ProtectedHealthInfo" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phiType" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtectedHealthInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityScan" (
    "id" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "startedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "findings" JSONB,

    CONSTRAINT "SecurityScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PHIAccessAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phiToken" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasAuthorized" BOOLEAN NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "purpose" TEXT,

    CONSTRAINT "PHIAccessAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtectedHealthInfo_token_key" ON "ProtectedHealthInfo"("token");

-- CreateIndex
CREATE INDEX "ProtectedHealthInfo_userId_idx" ON "ProtectedHealthInfo"("userId");

-- CreateIndex
CREATE INDEX "ProtectedHealthInfo_phiType_idx" ON "ProtectedHealthInfo"("phiType");

-- CreateIndex
CREATE INDEX "SecurityScan_startedBy_idx" ON "SecurityScan"("startedBy");

-- CreateIndex
CREATE INDEX "SecurityScan_startedAt_idx" ON "SecurityScan"("startedAt");

-- CreateIndex
CREATE INDEX "SecurityScan_status_idx" ON "SecurityScan"("status");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_userId_idx" ON "PHIAccessAttempt"("userId");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_phiToken_idx" ON "PHIAccessAttempt"("phiToken");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_timestamp_idx" ON "PHIAccessAttempt"("timestamp");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_wasAuthorized_idx" ON "PHIAccessAttempt"("wasAuthorized");

-- AddForeignKey
ALTER TABLE "ProtectedHealthInfo" ADD CONSTRAINT "ProtectedHealthInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityScan" ADD CONSTRAINT "SecurityScan_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIAccessAttempt" ADD CONSTRAINT "PHIAccessAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EOL

# Update Prisma schema
cat >> packages/backend/prisma/schema.prisma << 'EOL'
// PHI Protection Models
model ProtectedHealthInfo {
  id            String    @id @default(uuid())
  token         String    @unique
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  phiType       String
  encryptedData String
  createdAt     DateTime  @default(now())
  lastAccessed  DateTime

  @@index([userId])
  @@index([phiType])
}

model SecurityScan {
  id          String    @id @default(uuid())
  scanType    String
  startedBy   String
  user        User      @relation(fields: [startedBy], references: [id])
  startedAt   DateTime
  completedAt DateTime?
  status      String
  findings    Json?

  @@index([startedBy])
  @@index([startedAt])
  @@index([status])
}

model PHIAccessAttempt {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phiToken      String
  timestamp     DateTime @default(now())
  wasAuthorized Boolean
  ipAddress     String
  userAgent     String
  purpose       String?

  @@index([userId])
  @@index([phiToken])
  @@index([timestamp])
  @@index([wasAuthorized])
}
EOL

# Update User model reference in Prisma schema
cat >> packages/backend/prisma/schema.prisma << 'EOL'

// Add to User model:
model User {
  // Existing fields...
  
  // Add these relations
  protectedHealthInfo ProtectedHealthInfo[]
  securityScans SecurityScan[]
  phiAccessAttempts PHIAccessAttempt[]
}
EOL

# Create PHI access policy enforcement
cat > packages/backend/src/services/security/accessPolicyService.ts << 'EOL'
// Access Policy Service for PHI
import { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../utils/auditLog';

// Log access attempt
const logAccessAttempt = async (
  userId: string,
  phiToken: string,
  wasAuthorized: boolean,
  request: Request,
  purpose?: string
) => {
  await prisma.pHIAccessAttempt.create({
    data: {
      userId,
      phiToken,
      wasAuthorized,
      ipAddress: request.ip || '0.0.0.0',
      userAgent: request.headers['user-agent'] || 'Unknown',
      purpose,
      timestamp: new Date()
    }
  });
  
  // Also create audit log entry
  await createAuditLog(
    userId,
    wasAuthorized ? 'PHI_ACCESS_GRANTED' : 'PHI_ACCESS_DENIED',
    'ProtectedHealthInfo',
    phiToken,
    { 
      purpose,
      ipAddress: request.ip || '0.0.0.0'
    }
  );
};

// Check if a user can access PHI based on role and relationship
const canAccessPHI = async (
  actorId: string, 
  targetUserId: string,
  phiType: string,
  request: Request,
  purpose?: string
): Promise<boolean> => {
  try {
    if (!actorId || !targetUserId) {
      return false;
    }
    
    // Always allow access to own PHI
    if (actorId === targetUserId) {
      await logAccessAttempt(actorId, `SELF_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
      return true;
    }
    
    // Get actor's role
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true }
    });
    
    if (!actor) {
      await logAccessAttempt(actorId, `UNKNOWN_ACTOR:${targetUserId}:${phiType}`, false, request, purpose);
      return false;
    }
    
    // Admin can access all PHI
    if (actor.role === 'ADMIN') {
      await logAccessAttempt(actorId, `ADMIN_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
      return true;
    }
    
    // Therapists can access their clients' PHI
    if (actor.role === 'THERAPIST') {
      // Check if client belongs to this therapist
      const therapistProfile = await prisma.therapistProfile.findFirst({
        where: { userId: actorId }
      });
      
      if (!therapistProfile) {
        await logAccessAttempt(actorId, `NO_THERAPIST_PROFILE:${targetUserId}:${phiType}`, false, request, purpose);
        return false;
      }
      
      const clientProfile = await prisma.clientProfile.findFirst({
        where: { 
          userId: targetUserId,
          therapistId: therapistProfile.id
        }
      });
      
      if (clientProfile) {
        await logAccessAttempt(actorId, `THERAPIST_ACCESS:${targetUserId}:${phiType}`, true, request, purpose);
        return true;
      }
    }
    
    // All other access attempts are denied
    await logAccessAttempt(actorId, `DENIED:${targetUserId}:${phiType}`, false, request, purpose);
    return false;
  } catch (error) {
    console.error('Error in access policy check:', error);
    // Log failed check attempt
    try {
      await logAccessAttempt(actorId, `ERROR:${targetUserId}:${phiType}`, false, request, purpose);
    } catch (logError) {
      console.error('Error logging access attempt:', logError);
    }
    return false;
  }
};

export const accessPolicyService = {
  canAccessPHI,
  logAccessAttempt
};
EOL

# Update server.ts to include new security middleware
cat >> packages/backend/src/server.ts << 'EOL'

// Add security middleware
import { securityHeadersMiddleware } from './middleware/security/securityHeadersMiddleware';
import { phiDetectionMiddleware } from './middleware/security/phiDetectionMiddleware';

// Apply security middleware (add these lines after other middleware like helmet and cors)
app.use(securityHeadersMiddleware);
app.use(phiDetectionMiddleware);
EOL

# Create update script for userService.ts
cat > scripts/update-user-service-for-phi.ts << 'EOL'
// Script to update userService.ts with PHI protection
import fs from 'fs';
import path from 'path';

const userServicePath = path.join(__dirname, '../packages/backend/src/services/userService.ts');

// Read existing file
let content = fs.readFileSync(userServicePath, 'utf8');

// Add import for phiVaultService
if (!content.includes('import { phiVaultService }')) {
  const importLine = `import { phiVaultService } from './encryption/phiVaultService';\n`;
  content = content.replace('import bcrypt from', importLine + 'import bcrypt from');
}

// Replace encryptData function with phiVaultService
const oldEncryptDataFn = /const encryptData = \(text: string\): string => {[\s\S]*?return text;[\s\S]*?};/;
const newEncryptDataFn = `const encryptData = (text: string): string => {
  // Use PHI Vault service for encryption
  return phiVaultService.encryptPHI(text);
};`;

content = content.replace(oldEncryptDataFn, newEncryptDataFn);

// Replace decryptData function with phiVaultService
const oldDecryptDataFn = /const decryptData = \(encryptedText: string\): string => {[\s\S]*?return encryptedText;[\s\S]*?};/;
const newDecryptDataFn = `const decryptData = (encryptedText: string): string => {
  // Use PHI Vault service for decryption
  return phiVaultService.decryptPHI(encryptedText);
};`;

content = content.replace(oldDecryptDataFn, newDecryptDataFn);

// Update isEncrypted function
const oldIsEncryptedFn = /const isEncrypted = \(text: string\): boolean => {[\s\S]*?return Boolean\([\s\S]*?};/;
const newIsEncryptedFn = `const isEncrypted = (text: string): boolean => {
  // Use PHI Vault service to check encryption
  return phiVaultService.isEncrypted(text);
};`;

content = content.replace(oldIsEncryptedFn, newIsEncryptedFn);

// Write back to file
fs.writeFileSync(userServicePath, content, 'utf8');

console.log('Updated userService.ts with PHI protection');
EOL

echo "Security architecture setup completed successfully."
echo ""
echo "Next steps:"
echo "1. Add ProtectedHealthInfo and other tables to the Prisma schema"
echo "2. Run 'npx prisma migrate dev' to apply the database changes"
echo "3. Update the AUTH_TOKEN_SECRET and DATABASE_ENCRYPTION_KEY in your .env files"
echo "4. Run the update script: 'npx ts-node scripts/update-user-service-for-phi.ts'"
echo ""
echo "Remember to revise each file according to your specific needs before using in production."