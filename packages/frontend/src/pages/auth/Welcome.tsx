import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const Welcome: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [therapistName, setTherapistName] = useState<string>('');
  const [step, setStep] = useState<'options' | 'code'>('options');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await api.get(`/onboarding/verify?token=${token}`);
        setTherapistName(res.data.therapistName || '');
      } catch {
        setMessage('Invalid or expired link');
      }
    };
    load();
  }, [token]);

  const sendCode = async () => {
    if (!token) return;
    await api.post('/onboarding/magic/send', { token, email });
    setStep('code');
  };

  const verify = async () => {
    if (!token) return;
    try {
      await api.post('/onboarding/magic/verify', { token, email, code });
      navigate('/intake');
    } catch {
      setMessage('Invalid code');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-xl font-semibold mb-2">Welcome to your care portal</h1>
      {therapistName && <p className="mb-4">From {therapistName}</p>}
      {message && <p className="text-red-600">{message}</p>}
      {step === 'options' ? (
        <div className="space-y-2">
          <button className="btn" onClick={() => setStep('code')}>Continue with Email</button>
          <button className="btn" onClick={() => alert('OAuth flow')}>Continue with Google</button>
          <button className="btn" onClick={() => alert('OAuth flow')}>Continue with Apple</button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            className="border p-2 w-full"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button className="btn" onClick={sendCode}>Send Code</button>
          <input
            className="border p-2 w-full"
            placeholder="6-digit code"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button className="btn" onClick={verify}>Verify</button>
        </div>
      )}
    </div>
  );
};

export default Welcome;
