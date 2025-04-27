// src/types/index.ts
export enum Role {
    ADMIN = 'ADMIN',
    THERAPIST = 'THERAPIST',
    CLIENT = 'CLIENT'
  }
  
  export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
  }
  
  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    role: Role;
  }
  
  export interface PasswordResetRequest {
    email: string;
  }
  
  export interface PasswordReset {
    token: string;
    password: string;
    confirmPassword: string;
  }