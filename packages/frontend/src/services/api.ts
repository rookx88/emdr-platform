// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Safe localStorage wrapper to handle storage access errors
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage access denied:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage access denied:', error);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage access denied:', error);
    }
  }
};

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token and debugging
api.interceptors.request.use(
  (config: any) => {
    console.log(`Request to: ${config.method?.toUpperCase()} ${config.url}`);
    
    const token = safeLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token attached to request');
    } else {
      console.log('No token available for request');
    }
    return config;
  },
  (error: any) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors and debugging
api.interceptors.response.use(
  (response: any) => {
    console.log(`Response from: ${response.config.url}`, response.status);
    return response;
  },
  (error: any) => {
    console.error(
      'Response error:', 
      error.config?.url,
      error.response?.status, 
      error.response?.data || error.message
    );
    
    if (error.response?.status === 401) {
      // Unauthorized, clear auth data
      console.log('Unauthorized response - clearing auth data');
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to check backend connectivity
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking backend connectivity...');
    // Try health endpoint first
    await api.get('/health');
    console.log('Backend connected (health endpoint)');
    return true;
  } catch (healthError) {
    try {
      // Fallback to a GET on the base API URL
      await axios.get(API_URL);
      console.log('Backend connected (base endpoint)');
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
};

// Auth endpoints
export const authService = {
  login: async (email: string, password: string) => {
    console.log('Attempting login with email:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      console.log('Login successful, received data:', data);
      
      // Safely store token and user data
      if (data.token) {
        safeLocalStorage.setItem('token', data.token);
        console.log('Token stored');
      }
      if (data.user) {
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
        console.log('User data stored');
      }
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  register: async (userData: { 
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string, 
    role: 'THERAPIST' | 'CLIENT' 
  }) => {
    console.log('Attempting registration with data:', {
      ...userData,
      password: '[REDACTED]'
    });
    const response = await api.post('/auth/register', userData);
    console.log('Registration response:', response.data);
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    console.log('Sending forgot password request for:', email);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  },
  
  resetPassword: async (token: string, password: string) => {
    console.log('Attempting password reset with token');
    const response = await api.post('/auth/reset-password', { token, password });
    console.log('Password reset response:', response.data);
    return response.data;
  },
  
  logout: async () => {
    console.log('Attempting logout');
    try {
      await api.post('/auth/logout');
      console.log('Logout API call successful');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      console.log('Clearing local auth data');
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
    }
  }
};

// User endpoints
export const userService = {
  getCurrentUser: async () => {
    console.log('Fetching current user info');
    try {
      const response = await api.get('/users/me');
      console.log('Current user data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },
  
  updateProfile: async (userData: any) => {
    console.log('Updating user profile with data:', userData);
    const response = await api.put('/users/profile', userData);
    console.log('Profile update response:', response.data);
    return response.data;
  }
};

// Export the api instance as default
export default api;