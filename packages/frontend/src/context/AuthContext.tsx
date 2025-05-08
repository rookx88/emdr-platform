// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, userService } from '../services/api';
import { User } from '../types/index';

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
      console.log("Running verifyAuth...");
      const userData = await userService.getCurrentUser();
      console.log("verifyAuth result:", userData);
      setUser(userData);
      safeLocalStorage.setItem('user', JSON.stringify(userData));
      console.log("User updated from verifyAuth");
      return true;
    } catch (err) {
      console.error("verifyAuth failed:", err);
      // Auth failed - clear user data
      safeLocalStorage.removeItem('user');
      setUser(null);
      console.log("User cleared due to verifyAuth failure");
      return false;
    }
  }, []);

  // Set up periodic auth verification (every 15 minutes)
  useEffect(() => {
    console.log("Auth timer effect - user:", !!user, "timer:", !!authTimer);
    if (user && !authTimer) {
      console.log("Setting up authentication verification timer");
      const timer = setInterval(() => {
        console.log("Running periodic auth check");
        verifyAuth().catch(console.error);
      }, 15 * 60 * 1000); // 15 minutes
      
      setAuthTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
        console.log("Cleared authentication timer during cleanup");
      };
    } else if (!user && authTimer) {
      console.log("Clearing authentication timer as user is null");
      clearInterval(authTimer);
      setAuthTimer(null);
    }
    
    return () => {
      if (authTimer) {
        clearInterval(authTimer);
        console.log("Cleared authentication timer during cleanup");
      }
    };
  }, [user, authTimer, verifyAuth]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      console.log("Initializing authentication state");
      setLoading(true);
      
      // First check if we have a stored user
      const storedUser = safeLocalStorage.getItem('user');
      console.log("Initial auth check - stored user exists:", !!storedUser);
      
      if (storedUser) {
        try {
          // Set the user from localStorage first
          const parsedUser = JSON.parse(storedUser);
          console.log("Parsed stored user:", parsedUser);
          setUser(parsedUser);
          console.log("User state set from localStorage");
          
          // Then verify with the server
          console.log("Verifying authentication with server");
          await verifyAuth();
        } catch (err) {
          console.error('Failed to verify authentication', err);
        }
      } else {
        console.log("No stored user found in localStorage");
      }
      
      setLoading(false);
      console.log("Authentication initialization completed, loading:", false);
    };
    
    initAuth();
  }, [verifyAuth]);

  const login = async (email: string, password: string) => {
    console.log("Login function called for email:", email);
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      console.log("Login successful, data:", data);
      
      // Set user in context state
      setUser(data.user);
      console.log("User state set after login:", data.user);
      
      // Double-check localStorage (authService should have already stored this)
      const storedUser = safeLocalStorage.getItem('user');
      console.log("Stored user after login:", storedUser);
      
      // If for some reason the user wasn't stored, store it now
      if (!storedUser && data.user) {
        console.log("Storing user in localStorage as backup");
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
      console.log("Login process completed, loading:", false);
    }
  };

  const register = async (userData: any) => {
    console.log("Register function called");
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      console.log("Registration successful:", data);
      // Note: We don't auto-login after registration as it might need verification
      return data;
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
      console.log("Registration process completed");
    }
  };

  const logout = async () => {
    console.log("Logout function called");
    setLoading(true);
    try {
      await authService.logout();
      console.log("Logout API call successful");
    } catch (err) {
      console.error('Logout failed on server, clearing local storage anyway', err);
    } finally {
      // Clear local user state
      setUser(null);
      console.log("User state cleared after logout");
      
      // Clear auth timer
      if (authTimer) {
        clearInterval(authTimer);
        setAuthTimer(null);
        console.log("Auth timer cleared after logout");
      }
      
      setLoading(false);
      console.log("Logout process completed");
    }
  };

  const forgotPassword = async (email: string) => {
    console.log("Forgot password called for email:", email);
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      console.log("Forgot password request successful");
    } catch (err: any) {
      console.error("Forgot password failed:", err);
      setError(err.response?.data?.message || 'Failed to process password reset request');
      throw err;
    } finally {
      setLoading(false);
      console.log("Forgot password process completed");
    }
  };

  const resetPassword = async (token: string, password: string) => {
    console.log("Reset password called");
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      console.log("Password reset successful");
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setError(err.response?.data?.message || 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
      console.log("Password reset process completed");
    }
  };

  // Helper method to update user in context
  const updateUser = (userData: Partial<User>) => {
    console.log("Updating user data:", userData);
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
      console.log("User updated in context and localStorage");
    } else {
      console.warn("Cannot update user: no user in context");
    }
  };

  // For debugging - log auth state changes
  useEffect(() => {
    console.log("Auth context state changed - user:", !!user, "loading:", loading);
  }, [user, loading]);

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