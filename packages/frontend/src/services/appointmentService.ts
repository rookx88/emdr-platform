// packages/frontend/src/services/appointmentService.ts
import api from './api';

export const appointmentService = {
  /**
   * Get all appointments for the current user
   */
  getAppointments: async (startDate?: string, endDate?: string, status?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (status) params.status = status;
    
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  
  /**
   * Get a specific appointment by ID
   */
  getAppointment: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  
  /**
   * Create a new appointment
   */
  createAppointment: async (appointmentData: any) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  /**
   * Update an existing appointment
   */
  updateAppointment: async (id: string, appointmentData: any) => {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },
  
  /**
   * Cancel an appointment
   */
  cancelAppointment: async (id: string, reason: string) => {
    const response = await api.delete(`/appointments/${id}`, {
      data: { reason }
    });
    return response.data;
  },
  
  /**
   * Get therapist availability
   */
  getTherapistAvailability: async (therapistId: string) => {
    const response = await api.get(`/therapists/${therapistId}/availability`);
    return response.data;
  },
  
  /**
   * Set therapist availability
   */
  setTherapistAvailability: async (therapistId: string, availability: any[]) => {
    const response = await api.post(`/therapists/${therapistId}/availability`, {
      availability
    });
    return response.data;
  },
  
  /**
   * Get available therapists for booking
   */
  getAvailableTherapists: async () => {
    const response = await api.get('/therapists/available');
    return response.data;
  }
};

export default appointmentService;