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
