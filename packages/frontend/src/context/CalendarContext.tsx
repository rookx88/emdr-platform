// packages/frontend/src/context/CalendarContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

// Define types for appointments and availability
export interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
  clientId: string;
  therapistId: string;
  client?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    }
  };
  therapist?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    }
  };
}

export interface AvailabilityWindow {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface TherapistProfile {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  specialties: string[];
}

interface CalendarContextType {
  // Appointments
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  refreshAppointments: () => Promise<void>;
  
  // Availability
  therapistId: string | null;
  availability: AvailabilityWindow[];
  loadingAvailability: boolean;
  availabilityError: string | null;
  setAvailability: (availability: AvailabilityWindow[]) => void;
  saveAvailability: () => Promise<void>;
  
  // Therapist Booking
  availableTherapists: TherapistProfile[];
  loadingTherapists: boolean;
  
  // Appointment Management
  createAppointment: (appointmentData: any) => Promise<Appointment>;
  updateAppointment: (id: string, data: any) => Promise<Appointment>;
  cancelAppointment: (id: string, reason: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Therapist availability state
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  
  // Therapist booking state
  const [availableTherapists, setAvailableTherapists] = useState<TherapistProfile[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  
  // Fetch appointments based on selected date
  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Format date for filtering
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const response = await api.get('/appointments', {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        }
      });
      
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh appointments
  const refreshAppointments = async () => {
    await fetchAppointments();
  };
  
  // Fetch therapist profile and availability if user is a therapist
  const fetchTherapistData = async () => {
    if (user?.role !== 'THERAPIST') return;
    
    setLoadingAvailability(true);
    setAvailabilityError(null);
    
    try {
      // First get therapist profile
      const profileResponse = await api.get('/therapists/me');
      const therapistProfileId = profileResponse.data.id;
      setTherapistId(therapistProfileId);
      
      // Then get availability
      if (therapistProfileId) {
        const availabilityResponse = await api.get(`/therapists/${therapistProfileId}/availability`);
        setAvailability(availabilityResponse.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch therapist data:', err);
      setAvailabilityError(err.response?.data?.message || 'Failed to load therapist data');
    } finally {
      setLoadingAvailability(false);
    }
  };
  
  // Save therapist availability
  const saveAvailability = async () => {
    if (!therapistId) return;
    
    setSavingAvailability(true);
    setAvailabilityError(null);
    
    try {
      await api.post(`/therapists/${therapistId}/availability`, {
        availability
      });
      return;
    } catch (err: any) {
      console.error('Failed to save availability:', err);
      setAvailabilityError(err.response?.data?.message || 'Failed to save availability');
      throw err;
    } finally {
      setSavingAvailability(false);
    }
  };
  
  // Fetch available therapists for booking
  const fetchAvailableTherapists = async () => {
    if (user?.role !== 'CLIENT') return;
    
    setLoadingTherapists(true);
    
    try {
      const response = await api.get('/therapists/available');
      setAvailableTherapists(response.data);
    } catch (err: any) {
      console.error('Failed to fetch therapists:', err);
    } finally {
      setLoadingTherapists(false);
    }
  };
  
  // Create a new appointment
  const createAppointment = async (appointmentData: any): Promise<Appointment> => {
    try {
      const response = await api.post('/appointments', appointmentData);
      // Refresh appointments after creating a new one
      await refreshAppointments();
      return response.data;
    } catch (err: any) {
      console.error('Failed to create appointment:', err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Failed to create appointment');
    }
  };
  
  // Update an existing appointment
  const updateAppointment = async (id: string, data: any): Promise<Appointment> => {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      // Refresh appointments after update
      await refreshAppointments();
      return response.data;
    } catch (err: any) {
      console.error('Failed to update appointment:', err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Failed to update appointment');
    }
  };
  
  // Cancel an appointment
  const cancelAppointment = async (id: string, reason: string): Promise<void> => {
    try {
      await api.delete(`/appointments/${id}`, {
        data: { reason }
      });
      // Refresh appointments after cancellation
      await refreshAppointments();
    } catch (err: any) {
      console.error('Failed to cancel appointment:', err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Failed to cancel appointment');
    }
  };
  
  // Fetch appointments when selected date changes or user changes
  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [selectedDate, user]);
  
  // Fetch therapist-specific data if therapist
  useEffect(() => {
    if (user?.role === 'THERAPIST') {
      fetchTherapistData();
    }
  }, [user]);
  
  // Fetch available therapists if client
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchAvailableTherapists();
    }
  }, [user]);
  
  // Define context value
  const contextValue: CalendarContextType = {
    // Appointments
    appointments,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    refreshAppointments,
    
    // Availability
    therapistId,
    availability,
    loadingAvailability,
    availabilityError,
    setAvailability,
    saveAvailability,
    
    // Therapist Booking
    availableTherapists,
    loadingTherapists,
    
    // Appointment Management
    createAppointment,
    updateAppointment,
    cancelAppointment
  };
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};