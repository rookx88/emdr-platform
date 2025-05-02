// packages/frontend/src/components/calendar/AppointmentModal.tsx
import React, { useState } from 'react';
import { useCalendar, Appointment } from '../../context/CalendarContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  userRole: string;
}

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
                ? `${appointment.client?.user.firstName || ''} ${appointment.client?.user.lastName || ''}`
                : `${appointment.therapist?.user.firstName || ''} ${appointment.therapist?.user.lastName || ''}`}
            </p>
          </div>
          
          {/* Status selection (for therapist only) */}
          {userRole === 'THERAPIST' && appointment.status !== 'CANCELED' && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Status</h4>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          )}
          
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
                  type="button"
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
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded mr-2"
          >
            Close
          </button>
          {appointment.status !== 'CANCELED' && (
            <button
              type="button"
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

export default AppointmentModal;