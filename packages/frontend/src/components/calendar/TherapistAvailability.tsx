// packages/frontend/src/components/calendar/TherapistAvailability.tsx
import React, { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';

const TherapistAvailability: React.FC = () => {
  const { 
    availability, 
    loadingAvailability, 
    availabilityError, 
    setAvailability, 
    saveAvailability 
  } = useCalendar();
  
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Default availability if none exists
  const defaultAvailability = [
    { id: 'temp-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isRecurring: true },
    { id: 'temp-2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isRecurring: true },
    { id: 'temp-3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isRecurring: true },
    { id: 'temp-4', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isRecurring: true },
    { id: 'temp-5', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isRecurring: true }
  ];

  // Add new availability window
  const addAvailabilityWindow = () => {
    // Find first day that doesn't have availability
    const existingDays = availability.map(window => window.dayOfWeek);
    let newDay = 1;
    while (existingDays.includes(newDay) && newDay < 7) {
      newDay++;
    }
    
    // If all days are taken, just add Monday
    if (newDay > 6) newDay = 1;
    
    setAvailability([
      ...availability, 
      { id: `temp-${Date.now()}`, dayOfWeek: newDay, startTime: '09:00', endTime: '17:00', isRecurring: true }
    ]);
    
    // Clear any success message when making changes
    setSuccessMessage(null);
  };

  // Remove availability window
  const removeAvailabilityWindow = (index: number) => {
    const newAvailability = [...availability];
    newAvailability.splice(index, 1);
    setAvailability(newAvailability);
    
    // Clear any success message when making changes
    setSuccessMessage(null);
  };

  // Update availability window
  const updateAvailabilityWindow = (index: number, field: string, value: string | number) => {
    const newAvailability = [...availability];
    newAvailability[index] = {
      ...newAvailability[index],
      [field]: value
    };
    setAvailability(newAvailability);
    
    // Clear any success message when making changes
    setSuccessMessage(null);
  };

  // Save availability
  const handleSaveAvailability = async () => {
    setSaving(true);
    setSuccessMessage(null);
    
    try {
      await saveAvailability();
      setSuccessMessage('Availability saved successfully!');
    } catch (err) {
      // Error handling is already done in the context
      console.error('Error saving availability:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAvailability) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your availability...</p>
      </div>
    );
  }

  // Use provided availability or default if empty
  const displayAvailability = availability.length > 0 ? availability : defaultAvailability;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Set Your Weekly Availability</h2>
      
      {availabilityError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {availabilityError}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Set your regular weekly hours when you're available for appointments.
          Clients will be able to book during these time slots.
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        {displayAvailability.map((window, index) => (
          <div key={window.id || index} className="flex items-center space-x-4 p-3 border rounded bg-gray-50">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={window.dayOfWeek}
                onChange={e => updateAvailabilityWindow(index, 'dayOfWeek', parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              >
                {weekdays.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={window.startTime}
                onChange={e => updateAvailabilityWindow(index, 'startTime', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={window.endTime}
                onChange={e => updateAvailabilityWindow(index, 'endTime', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="w-1/6 flex items-end">
              <button
                onClick={() => removeAvailabilityWindow(index)}
                className="p-2 text-red-600 hover:text-red-800"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={addAvailabilityWindow}
          className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
        >
          + Add Time Slot
        </button>
        
        <button
          onClick={handleSaveAvailability}
          disabled={saving || displayAvailability.length === 0}
          className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${
            saving || displayAvailability.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default TherapistAvailability;