// packages/frontend/src/components/therapist/ScheduleSessionModal.tsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AppointmentType } from '../../types/index';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  therapistId: string;
  onSessionScheduled: () => void;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

const ScheduleSessionModal: React.FC<ScheduleSessionModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  therapistId,
  onSessionScheduled
}) => {
  // Form state
  const [date, setDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [sessionType, setSessionType] = useState<AppointmentType>(AppointmentType.STANDARD);
  const [notes, setNotes] = useState<string>('');
  const [sendConfirmation, setSendConfirmation] = useState<boolean>(true);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // On mount, populate available dates (next 14 days)
  useEffect(() => {
    if (isOpen) {
      generateAvailableDates();
    }
  }, [isOpen]);
  
  // When date changes, fetch available slots
  useEffect(() => {
    if (date) {
      fetchAvailableSlots();
    }
  }, [date, therapistId]);
  
  // Generate dates for the next 14 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate.toISOString().split('T')[0]);
    }
    
    setAvailableDates(dates);
  };
  
  // Fetch available slots from the server
  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch real availability from the server
      const response = await api.get(`/therapists/${therapistId}/availability`, {
        params: {
          date,
        }
      });
      
      // If the backend returns actual availability windows
      if (response.data && response.data.length > 0) {
        setAvailableSlots(response.data);
      } else {
        // Fallback to simulated slots if no real data is available
        generateSimulatedSlots();
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      // Fallback to simulated slots if API fails
      generateSimulatedSlots();
    } finally {
      setLoading(false);
    }
  };
  
  // Generate simulated time slots (9am-5pm, hourly) if API fails
  const generateSimulatedSlots = () => {
    const slots = [];
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    // Skip weekends in the simulation
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (let hour = 9; hour < 17; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        slots.push({ startTime, endTime });
      }
    }
    
    setAvailableSlots(slots);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle session scheduling
  const handleScheduleSession = async () => {
    if (!date || !selectedSlot || !sessionType) {
      setError('Please select date, time and session type');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse selected time slot
      const [startHour, startMinute] = selectedSlot.split(':');
      const startTime = new Date(`${date}T${startHour}:${startMinute}:00`);
      
      // Default session duration: 50 minutes
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 50);
      
      // Create appointment
      const response = await api.post('/appointments', {
        clientId,
        therapistId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: sessionType,
        notes,
        title: `${sessionType} Session with ${clientName}`,
        isVirtual: true,
        sendConfirmation
      });
      
      // Show success message
      setSuccess(true);
      
      // Notify parent component
      if (onSessionScheduled) {
        onSessionScheduled();
      }
      
      // Reset form after success
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to schedule session:', err);
      setError(err.response?.data?.message || 'Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-lg px-6 py-4 text-white">
          <h2 className="text-xl font-semibold">Schedule Session with {clientName}</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
              Session scheduled successfully!
            </div>
          )}
          
          {!success && (
            <form>
              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value="">-- Select a date --</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>
                      {formatDate(d)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Time Slots */}
              {date && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Time
                  </label>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedSlot(slot.startTime)}
                          className={`p-2 text-sm border rounded-md ${
                            selectedSlot === slot.startTime
                              ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic p-2">
                      No available slots for this date.
                    </p>
                  )}
                </div>
              )}
              
              {/* Session Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as AppointmentType)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value={AppointmentType.STANDARD}>Standard Session</option>
                  <option value={AppointmentType.EMDR}>EMDR Session</option>
                  <option value={AppointmentType.INTAKE}>Initial Intake</option>
                  <option value={AppointmentType.FOLLOWUP}>Follow-up Session</option>
                  <option value={AppointmentType.EMERGENCY}>Emergency Session</option>
                </select>
              </div>
              
              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any notes for this session..."
                  disabled={loading}
                ></textarea>
              </div>
              
              {/* Send Confirmation Email */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="send-confirmation"
                    type="checkbox"
                    checked={sendConfirmation}
                    onChange={(e) => setSendConfirmation(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="send-confirmation" className="ml-2 block text-sm text-gray-700">
                    Send confirmation email to client
                  </label>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleSession}
                  disabled={loading || !date || !selectedSlot || !sessionType}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading || !date || !selectedSlot || !sessionType ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;