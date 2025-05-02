// packages/frontend/src/components/calendar/CalendarControlPanel.tsx
import React, { useState } from 'react';
import TherapistAvailability from './TherapistAvailability';
import AppointmentBooking from './AppointmentBooking';

interface CalendarControlPanelProps {
  userRole: string;
}

const CalendarControlPanel: React.FC<CalendarControlPanelProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'availability' | 'appointment'>('availability');
  
  return (
    <div className={`calendar-control-panel ${isOpen ? 'open' : 'closed'}`}>
      {/* Toggle button */}
      <button 
        className="calendar-panel-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close controls" : "Open controls"}
      >
        {isOpen ? '❯' : '❮'}
      </button>
      
      {/* Panel content */}
      <div className="calendar-panel-content">
        <div className="calendar-panel-header">
          <h2 className="text-xl font-semibold">Calendar Controls</h2>
        </div>
        
        {/* Tabs */}
        <div className="calendar-panel-tabs">
          <button 
            className={`calendar-panel-tab ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            Availability Settings
          </button>
          <button 
            className={`calendar-panel-tab ${activeTab === 'appointment' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointment')}
          >
            Add Appointment
          </button>
        </div>
        
        {/* Tab content */}
        <div className="calendar-panel-tab-content">
          {activeTab === 'availability' && userRole === 'THERAPIST' && (
            <TherapistAvailability />
          )}
          
          {activeTab === 'appointment' && (
            <AppointmentBooking />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarControlPanel;