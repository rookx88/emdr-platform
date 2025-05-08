// packages/frontend/src/components/security/PHIDisplay.tsx
import React, { useState, useEffect } from 'react';
import { phiService } from '../../services/phiService';

interface PHIDisplayProps {
  value: string;
  fieldName: string;
  purpose?: string;
  canView?: boolean;
  redactByDefault?: boolean;
}

/**
 * Component for safely displaying PHI with proper handling of tokens
 * 
 * Features:
 * - Displays tokenized PHI as protected by default
 * - Allows authorized viewing with proper purpose logging
 * - Visual indicators for PHI content
 */
const PHIDisplay: React.FC<PHIDisplayProps> = ({
  value,
  fieldName,
  purpose = 'Viewing field in UI',
  canView = false,
  redactByDefault = true
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isProtected, setIsProtected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detect if the value contains PHI tokens
  const containsPhiTokens = phiService.containsPhiTokens(value);
  
  // Function to toggle viewing of PHI
  const toggleView = async () => {
    if (!canView) return;
    
    if (isProtected) {
      setIsLoading(true);
      try {
        // Detokenize for viewing
        const detokenized = await phiService.detokenize(value, purpose);
        setDisplayValue(detokenized);
        setIsProtected(false);
        setError(null);
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Re-protect the PHI
      setDisplayValue(value.replace(/\[PHI:[a-f0-9]{64}\]/g, '[Protected Information]'));
      setIsProtected(true);
    }
  };
  
  // Initial processing
  useEffect(() => {
    const processValue = async () => {
      if (!value) {
        setDisplayValue('');
        return;
      }
      
      if (containsPhiTokens) {
        if (!redactByDefault && canView) {
          setIsLoading(true);
          try {
            // Detokenize by default if allowed
            const detokenized = await phiService.detokenize(value, purpose);
            setDisplayValue(detokenized);
            setIsProtected(false);
            setError(null);
          } catch (err: any) {
            setDisplayValue(value.replace(/\[PHI:[a-f0-9]{64}\]/g, '[Protected Information]'));
            setError(`Error: ${err.message}`);
          } finally {
            setIsLoading(false);
          }
        } else {
          // Redact PHI
          setDisplayValue(value.replace(/\[PHI:[a-f0-9]{64}\]/g, '[Protected Information]'));
          setIsProtected(true);
        }
      } else {
        // Not PHI, display normally
        setDisplayValue(value);
        setIsProtected(false);
      }
    };
    
    processValue();
  }, [value, canView, redactByDefault, purpose, containsPhiTokens]);
  
  // Render loading state
  if (isLoading) {
    return <span className="text-gray-500 italic">Loading protected information...</span>;
  }
  
  // If there's an error
  if (error) {
    return (
      <div>
        <span className="text-red-500 text-sm">{error}</span>
        <br />
        <span>{displayValue}</span>
      </div>
    );
  }
  
  // If this is PHI and can be viewed
  if (containsPhiTokens && canView) {
    return (
      <div className="phi-field">
        <span className={isProtected ? "text-gray-800" : "text-black"}>
          {displayValue}
        </span>
        <button
          onClick={toggleView}
          className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
        >
          {isProtected ? "Show" : "Hide"}
        </button>
        {!isProtected && (
          <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
            Protected Info
          </span>
        )}
      </div>
    );
  }
  
  // For PHI that cannot be viewed
  if (containsPhiTokens && !canView) {
    return (
      <div className="phi-field">
        <span className="text-gray-800">{displayValue}</span>
        <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-1 py-0.5 rounded">
          Protected
        </span>
      </div>
    );
  }
  
  // For non-PHI values
  return <span>{displayValue}</span>;
};

export default PHIDisplay;