// packages/frontend/src/pages/client/AppointmentsPage.tsx
import React, { useState } from 'react';
import Calendar from '../../components/calendar/Calendar';
import AppointmentBooking from '../../components/calendar/AppointmentBooking';

const ClientAppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'book'>('calendar');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
        <p className="mt-1 text-gray-600">
          View your scheduled appointments and book new sessions.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-6 ${
              activeTab === 'calendar'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Calendar
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`py-4 px-6 ${
              activeTab === 'book'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Book New Appointment
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div>
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'book' && <AppointmentBooking />}
      </div>
    </div>
  );
};

export default ClientAppointmentsPage;