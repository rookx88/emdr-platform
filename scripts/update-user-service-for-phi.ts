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
