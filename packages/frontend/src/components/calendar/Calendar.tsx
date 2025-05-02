// packages/frontend/src/components/calendar/Calendar.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCalendar, Appointment } from '../../context/CalendarContext';
import './Calendar.css';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  userRole: string;
}

// Simple modal component for viewing appointment details
const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment, 
  userRole 
}) => {
  const { updateAppointment, cancelAppointment } = useCalendar();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [status, setStatus] = useState(appointment.status);

  if (!isOpen) return null;

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Handle appointment update
  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await updateAppointment(appointment.id, {
        notes,
        status
      });
      
      // Close the modal after successful update
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update appointment');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle appointment cancellation
  const handleCancel = async () => {
    try {
      setIsCanceling(true);
      setError(null);
      
      await cancelAppointment(appointment.id, cancelReason);
      
      // Close the modal after successful cancellation
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-90vh overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-medium">{appointment.title}</h3>
          <div className="text-gray-500 mt-1">
            {appointment.type} Session - {appointment.status}
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Time</h4>
            <p className="text-gray-700">
              {formatDateTime(appointment.startTime)} - {new Date(appointment.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">
              {userRole === 'THERAPIST' ? 'Client' : 'Therapist'}
            </h4>
            <p className="text-gray-700">
              {userRole === 'THERAPIST' 
                ? `${appointment.client?.user.firstName} ${appointment.client?.user.lastName}`
                : `${appointment.therapist?.user.firstName} ${appointment.therapist?.user.lastName}`}
            </p>
          </div>
          
          {/* Notes section */}
          <div className="mb-4">
            <h4 className="font-medium mb-1">Notes</h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              disabled={appointment.status === 'CANCELED'}
            ></textarea>
          </div>
          
          {/* Cancellation section */}
          {appointment.status !== 'CANCELED' && (
            <div className="mb-4 border-t pt-4">
              <h4 className="font-medium text-red-600 mb-1">Cancel Appointment</h4>
              <p className="text-sm text-gray-600 mb-2">
                If you need to cancel this appointment, please provide a reason:
              </p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Reason for cancellation..."
              ></textarea>
              <div className="mt-2">
                <button
                  onClick={handleCancel}
                  disabled={isCanceling || !cancelReason.trim()}
                  className={`px-3 py-1 rounded text-white bg-red-600 hover:bg-red-700 ${
                    isCanceling || !cancelReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCanceling ? 'Canceling...' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded mr-2"
          >
            Close
          </button>
          {appointment.status !== 'CANCELED' && (
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Calendar component
const Calendar: React.FC = () => {
  const { user } = useAuth();
  const { 
    appointments, 
    loading, 
    error, 
    selectedDate, 
    setSelectedDate 
  } = useCalendar();
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Calculate calendar days
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  // Handle date navigation
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number) => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate.getDate() === day && 
             appointmentDate.getMonth() === date.getMonth() &&
             appointmentDate.getFullYear() === date.getFullYear();
    });
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  // Format date for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Render calendar grid
  const renderCalendarDays = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="calendar-header-cell">
          {weekdays[i]}
        </div>
      );
    }
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAppointments = getAppointmentsForDay(day);
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === selectedDate.getMonth() &&
                      new Date().getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day-cell ${isToday ? 'today' : ''}`}
        >
          <div className="day-number">{day}</div>
          <div className="appointments-container">
            {dayAppointments.map(appointment => (
              <div 
                key={appointment.id}
                className={`appointment-item ${
                  appointment.status === 'CANCELED' 
                    ? 'canceled' 
                    : appointment.type === 'EMDR' 
                      ? 'emdr' 
                      : 'standard'
                }`}
                onClick={() => handleAppointmentClick(appointment)}
              >
                {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {user?.role === 'THERAPIST' 
                  ? appointment.client?.user.firstName 
                  : appointment.therapist?.user.firstName}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar header - updated with more rounded styling */}
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
        <button 
          onClick={goToPreviousMonth}
          className="px-3 py-1 rounded-full bg-white hover:bg-gray-100 shadow-sm transition-all border border-gray-200"
        >
          &larr;
        </button>
        <h2 className="text-xl font-semibold text-indigo-900">{formatMonthYear(selectedDate)}</h2>
        <button 
          onClick={goToNextMonth}
          className="px-3 py-1 rounded-full bg-white hover:bg-gray-100 shadow-sm transition-all border border-gray-200"
        >
          &rarr;
        </button>
      </div>
      
      {/* Loading and error states */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-800 text-center rounded-md mx-4 my-2">
          {error}
        </div>
      )}
      
      {/* Calendar grid */}
      {!loading && !error && (
        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>
      )}
      
      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          isOpen={showModal}
          onClose={handleCloseModal}
          appointment={selectedAppointment}
          userRole={user?.role || ''}
        />
      )}
    </div>
  );
};

export default Calendar;