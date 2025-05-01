// src/pages/auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const Login: React.FC = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  
  // Component state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to '/'
  const from = (location.state as any)?.from?.pathname || '/';
  
  // URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const redirectParam = queryParams.get('redirect');
  const sessionExpired = queryParams.get('expired') === 'true';
  
  // Set error message if session expired
  useEffect(() => {
    if (sessionExpired) {
      setError('Your session has expired. Please log in again.');
    }
  }, [sessionExpired]);
  
  // Email validation
  const validateEmail = (): boolean => {
    // Clear previous error
    setEmailError('');
    
    // Basic validation
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  // Password validation
  const validatePassword = (): boolean => {
    // Clear previous error
    setPasswordError('');
    
    // Basic validation
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear existing errors
    setError('');
    setEmailError('');
    setPasswordError('');
    
    // Set form as touched
    setFormTouched(true);
    
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    // Stop if validation fails
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Login function called for email:", email);
      await login(email, password);
      
      // Use dashboard route which will handle role-based redirection
      const redirectPath = redirectParam || (from === '/' ? '/dashboard' : from);
      
      console.log("Login successful, redirecting to:", redirectPath);
      
      // Add a small delay to ensure context is updated before redirect
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
        console.log("Navigation triggered to:", redirectPath);
      }, 100);
    } catch (err: any) {
      // Handle specific authentication errors
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403 && err.response?.data?.message?.includes('locked')) {
        setError(err.response.data.message || 'Your account is locked. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formTouched) validateEmail();
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (formTouched) validatePassword();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                create a new account
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={validateEmail}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={validatePassword}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;