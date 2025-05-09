// packages/frontend/src/pages/auth/AcceptInvitation.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AcceptInvitation: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [clientEmail, setClientEmail] = useState<string>('');
  const [therapistName, setTherapistName] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    agreeToTerms: false
  });
  
  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`/clients/verify-invite/${token}`);
        setTokenValid(true);
        setClientEmail(response.data.email);
        setTherapistName(response.data.therapistName || 'Your therapist');
        if (response.data.sessionInfo) {
          setSessionInfo(response.data.sessionInfo);
        }
      } catch (err: any) {
        console.error('Invalid invitation token:', err);
        setError(err.response?.data?.message || 'Invalid or expired invitation link');
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and privacy policy');
      setLoading(false);
      return;
    }
    
    try {
      // Complete registration
      await api.post(`/clients/complete-registration/${token}`, {
        password: formData.password,
        dateOfBirth: formData.dateOfBirth || null
      });
      
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      console.error('Failed to complete registration:', err);
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800">Validating your invitation...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-700 mb-4">Invitation Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-700 mb-4">Registration Complete!</h1>
          <p className="text-gray-600 mb-2">Your account has been successfully activated.</p>
          <p className="text-gray-600 mb-6">You will be redirected to the login page in a few seconds...</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome to EMDR Therapy Platform</h1>
          <p className="mt-1 opacity-90">Complete your registration to get started</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700">
              {therapistName} has invited you to join the EMDR Therapy Platform. 
              Please complete your registration below.
            </p>
            
            {sessionInfo && (
              <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-100">
                <h3 className="font-medium text-amber-800">Your First Session</h3>
                <p className="text-sm text-gray-600">A session has been scheduled for you:</p>
                <p className="mt-1"><strong>Date:</strong> {new Date(sessionInfo.startTime).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(sessionInfo.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p><strong>Type:</strong> {sessionInfo.type}</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={clientEmail}
                  className="w-full p-2 bg-gray-100 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Create a secure password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long and include a mix of letters, numbers, and symbols
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Confirm your password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div className="mt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      required
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      I agree to the <a href="/terms" className="text-amber-600 hover:text-amber-500">Terms of Service</a> and <a href="/privacy" className="text-amber-600 hover:text-amber-500">Privacy Policy</a>, including HIPAA-compliant handling of my health information.
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;