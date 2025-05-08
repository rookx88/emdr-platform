// src/types/index.ts
export enum Role {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  CLIENT = 'CLIENT'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum AppointmentType {
  INTAKE = 'INTAKE',
  STANDARD = 'STANDARD',
  EMDR = 'EMDR',
  FOLLOWUP = 'FOLLOWUP',
  EMERGENCY = 'EMERGENCY'
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

export interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  clientId: string;
  therapistId: string;
  isVirtual: boolean;
  videoSessionId?: string;
  videoSessionUrl?: string;
  client?: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    }
  };
  therapist?: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    }
  };
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
  cancelReason?: string;
}