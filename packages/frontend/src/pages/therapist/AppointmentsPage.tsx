// packages/frontend/src/pages/therapist/AppointmentsPage.tsx
import React, { useState } from 'react';
import Calendar from '../../components/calendar/Calendar';
import { CalendarProvider } from '../../context/CalendarContext';

const AppointmentsPage: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'availability'>('calendar');
  
  return (
    <div className="appointments-page">
      <h1 className="text-2xl font-bold mb-4">Appointments & Availability</h1>
      <p className="mb-4">Manage your appointments and set your recurring availability for clients to book.</p>
      
      {/* Tab buttons with rounded styling */}
      <div className="mb-6">
        <button
          className={`px-4 py-2 mr-2 rounded-full transition-colors ${
            view === 'calendar' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setView('calendar')}
        >
          Appointments Calendar
        </button>
        <button
          className={`px-4 py-2 rounded-full transition-colors ${
            view === 'availability' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setView('availability')}
        >
          Set Availability
        </button>
      </div>
      
      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="calendar-wrapper rounded-xl overflow-hidden shadow-lg">
          <CalendarProvider>
            <Calendar />
          </CalendarProvider>
        </div>
      )}
      
      {/* Availability View */}
      {view === 'availability' && (
        <div className="availability-container bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Set Your Recurring Availability</h2>
          
          <div className="weekday-availability">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{day}</span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked={day !== 'Friday'} />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <select className="px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                  </select>
                  <span>to</span>
                  <select className="px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>5:00 PM</option>
                    <option>6:00 PM</option>
                    <option>7:00 PM</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Save Availability
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;