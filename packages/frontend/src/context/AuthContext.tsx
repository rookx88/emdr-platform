// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, userService } from '../services/api';
import { User } from '../types';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authTimer, setAuthTimer] = useState<NodeJS.Timeout | null>(null);

  // Function to verify auth status
  const verifyAuth = useCallback(async () => {
    try {
      const userData = await userService.getCurrentUser();
      setUser(userData);
      safeLocalStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (err) {
      // Auth failed - clear user data
      localStorage.removeItem('user');
      setUser(null);
      return false;
    }
  }, []);

  // Set up periodic auth verification (every 15 minutes)
  useEffect(() => {
    if (user && !authTimer) {
      const timer = setInterval(() => {
        verifyAuth().catch(console.error);
      }, 15 * 60 * 1000); // 15 minutes
      
      setAuthTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (!user && authTimer) {
      clearInterval(authTimer);
      setAuthTimer(null);
    }
    
    return () => {
      if (authTimer) clearInterval(authTimer);
    };
  }, [user, authTimer, verifyAuth]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // First check if we have a stored user
      const storedUser = safeLocalStorage.getItem('user');
      
      if (storedUser) {
        try {
          // Set the user from localStorage first
          setUser(JSON.parse(storedUser));
          
          // Then verify with the server
          await verifyAuth();
        } catch (err) {
          console.error('Failed to verify authentication', err);
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [verifyAuth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      // Note: We don't auto-login after registration as it might need verification
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed on server, clearing local storage anyway');
    } finally {
      // Clear local user state
      setUser(null);
      // Clear auth timer
      if (authTimer) {
        clearInterval(authTimer);
        setAuthTimer(null);
      }
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process password reset request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper method to update user in context
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};