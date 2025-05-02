// packages/frontend/src/components/calendar/AppointmentBooking.tsx
import React, { useState, useEffect } from 'react';
import { useCalendar } from '../../context/CalendarContext';

interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
}

const AppointmentBooking: React.FC = () => {
  const { 
    availableTherapists, 
    loadingTherapists, 
    createAppointment 
  } = useCalendar();
  
  // Local state for form
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState('STANDARD');
  const [notes, setNotes] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate available dates based on selected therapist
  useEffect(() => {
    if (selectedTherapist) {
      setSelectedDate(null);
      setSelectedSlot(null);
      
      // Generate some dates for the next 2 weeks
      const dates = [];
      const today = new Date();
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }
      
      setAvailableDates(dates);
    } else {
      setAvailableDates([]);
    }
  }, [selectedTherapist]);

  // Generate available time slots based on selected date
  useEffect(() => {
    if (selectedDate && selectedTherapist) {
      // Generate some time slots
      const slots = [];
      const baseDate = new Date(`${selectedDate}T00:00:00`);
      const day = baseDate.getDay();
      
      // Therapists generally work 9-5
      if (day >= 1 && day <= 5) {
        for (let hour = 9; hour < 17; hour++) {
          // Generate hourly slots
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          slots.push({
            date: selectedDate,
            startTime,
            endTime
          });
        }
      }
      
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedTherapist]);

  // Book appointment
  const bookAppointment = async () => {
    if (!selectedTherapist || !selectedDate || !selectedSlot || !sessionType) {
      setError('Please select all required fields');
      return;
    }
    
    setBooking(true);
    setError(null);
    
    try {
      // Parse the selected slot time
      const [startHour, startMinute] = selectedSlot.split(':');
      const endHour = String(Number(startHour) + 1).padStart(2, '0');
      
      const startTime = new Date(`${selectedDate}T${startHour}:${startMinute}:00`);
      const endTime = new Date(`${selectedDate}T${endHour}:${startMinute}:00`);
      
      // Create appointment using context
      await createAppointment({
        therapistId: selectedTherapist,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: sessionType,
        notes: notes,
        isVirtual: true
      });
      
      // Show success message
      setBookingSuccess(true);
      
      // Reset form
      setSelectedTherapist(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSessionType('STANDARD');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  // If already booked successfully, show confirmation
  if (bookingSuccess) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">Appointment Booked!</h2>
        <p className="text-gray-600 mb-4">
          Your appointment has been successfully scheduled. You will receive a confirmation email shortly.
        </p>
        <button
          onClick={() => setBookingSuccess(false)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Book an Appointment</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Therapist selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select a Therapist
          </label>
          <select
            value={selectedTherapist || ''}
            onChange={e => setSelectedTherapist(e.target.value || null)}
            className="w-full p-2 border rounded"
            disabled={loadingTherapists}
          >
            <option value="">-- Select Therapist --</option>
            {availableTherapists.map(therapist => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.user.firstName} {therapist.user.lastName}
                {therapist.specialties?.length > 0 ? ` (${therapist.specialties.join(', ')})` : ''}
              </option>
            ))}
          </select>
          {loadingTherapists && (
            <div className="mt-2 text-sm text-gray-500">Loading therapists...</div>
          )}
        </div>
        
        {/* Date selection */}
        {selectedTherapist && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select a Date
            </label>
            <select
              value={selectedDate || ''}
              onChange={e => setSelectedDate(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Date --</option>
              {availableDates.map(date => {
                const displayDate = new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                });
                return (
                  <option key={date} value={date}>{displayDate}</option>
                );
              })}
            </select>
          </div>
        )}
        
        {/* Time slot selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select a Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedSlot(slot.startTime)}
                  className={`p-2 border rounded ${
                    selectedSlot === slot.startTime
                      ? 'bg-indigo-100 border-indigo-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Session type */}
        {selectedSlot && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={e => setSessionType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="STANDARD">Standard Session</option>
              <option value="EMDR">EMDR Session</option>
              <option value="INTAKE">Initial Intake</option>
              <option value="FOLLOWUP">Follow-up Session</option>
            </select>
          </div>
        )}
        
        {/* Notes */}
        {selectedSlot && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Any special requests or information the therapist should know..."
            ></textarea>
          </div>
        )}
        
        {/* Book button */}
        <div className="flex justify-end">
          <button
            onClick={bookAppointment}
            disabled={!selectedTherapist || !selectedDate || !selectedSlot || booking}
            className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${
              !selectedTherapist || !selectedDate || !selectedSlot || booking
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {booking ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;