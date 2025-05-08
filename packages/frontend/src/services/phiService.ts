// packages/frontend/src/services/phiService.ts
import api from './api';

/**
 * Service for handling PHI in the frontend
 */
export const phiService = {
  /**
   * Detokenize text containing PHI tokens
   * Only for authorized viewing with a specific purpose
   */
  async detokenize(text: string, purpose: string) {
    if (!text) return text;
    
    try {
      const response = await api.post('/phi/detokenize', {
        text,
        purpose
      });
      
      return response.data.text;
    } catch (error) {
      console.error('Error detokenizing PHI:', error);
      // If there's an error, return the original tokenized text
      return text;
    }
  },
  
  /**
   * Tokenize text that might contain PHI
   */
  async tokenize(text: string, userId: string, phiType: string) {
    if (!text) return text;
    
    try {
      const response = await api.post('/phi/tokenize', {
        text,
        userId,
        phiType
      });
      
      return response.data.text;
    } catch (error) {
      console.error('Error tokenizing PHI:', error);
      // If there's an error, return an error indicator
      return `[ERROR_TOKENIZING: ${error instanceof Error ? error.message : String(error)}]`;
    }
  },
  
  /**
   * Detect if a string contains PHI tokens
   */
  containsPhiTokens(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /\[PHI:[a-f0-9]{64}\]/.test(text);
  },
  
  /**
   * Process a display object to handle PHI tokens appropriately
   * 
   * This is used when displaying data in the UI, to either:
   * 1. Replace PHI tokens with a placeholder indicating sensitive data
   * 2. Detokenize PHI when authorized viewing is required
   */
  async processDisplayObject(
    obj: any,
    shouldDetokenize: boolean = false,
    purpose: string = ''
  ): Promise<any> {
    if (!obj) return obj;
    
    // Helper function to process text
    const processText = async (text: string) => {
      if (!text || typeof text !== 'string') return text;
      
      // If text contains PHI tokens
      if (this.containsPhiTokens(text)) {
        if (shouldDetokenize && purpose) {
          // Detokenize if authorized
          return await this.detokenize(text, purpose);
        } else {
          // Replace with placeholder
          return text.replace(/\[PHI:[a-f0-9]{64}\]/g, '[Protected Information]');
        }
      }
      
      return text;
    };
    
    // Handle arrays
    if (Array.isArray(obj)) {
      const result = [];
      for (const item of obj) {
        result.push(await this.processDisplayObject(item, shouldDetokenize, purpose));
      }
      return result;
    }
    
    // Handle objects
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          
          if (typeof value === 'string') {
            result[key] = await processText(value);
          } else if (typeof value === 'object' && value !== null) {
            result[key] = await this.processDisplayObject(value, shouldDetokenize, purpose);
          } else {
            result[key] = value;
          }
        }
      }
      
      return result;
    }
    
    // Return primitive values as is
    return obj;
  },
  
  /**
   * For admins: Run a security scan to find unencrypted PHI
   */
  async runSecurityScan() {
    const response = await api.post('/phi/security-scan');
    return response.data;
  },
  
  /**
   * For admins: Get the results of a security scan
   */
  async getSecurityScanResults(scanId: string) {
    const response = await api.get(`/phi/security-scan/${scanId}`);
    return response.data;
  },
  
  /**
   * For admins: Fix unencrypted PHI found in a security scan
   */
  async fixUnencryptedPHI(scanId: string) {
    const response = await api.post(`/phi/security-scan/${scanId}/fix`);
    return response.data;
  }
};

export default phiService;