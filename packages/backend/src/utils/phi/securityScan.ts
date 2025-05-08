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
