import React from 'react';

interface Props {
  phone?: string | null;
  email?: string | null;
  emailBody: string;
  oauthEnabled: boolean;
  onPrepare: () => void;
}

const InsuranceFallback: React.FC<Props> = ({ phone, email, emailBody, oauthEnabled, onPrepare }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <p>Insurance information was incomplete.</p>
      {phone && <p>Payer phone: {phone}</p>}
      <button onClick={onPrepare}>Prepare Email to Payer</button>
      {!oauthEnabled && email && (
        <a href={`mailto:${email}?subject=Coverage%20Inquiry&body=${encodeURIComponent(emailBody)}`}>Open Mail Client</a>
      )}
      <textarea readOnly value={emailBody} style={{ width: '100%', marginTop: '0.5rem' }} />
    </div>
  );
};

export default InsuranceFallback;
