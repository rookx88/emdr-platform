// packages/frontend/src/pages/therapist/CalendarPage.tsx
import React from 'react';
import Calendar from '../../components/calendar/Calendar';
import CalendarControlPanel from '../../components/calendar/CalendarControlPanel';
import { useAuth } from '../../context/AuthContext';
import { CalendarProvider } from '../../context/CalendarContext';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <CalendarProvider>
      <div className="calendar-page-container">
        
        
        {/* Main calendar */}
        <div className="calendar-main-container">
          <Calendar />
        </div>
        
        {/* Calendar control panel */}
        <CalendarControlPanel userRole={user?.role || ''} />
      </div>
    </CalendarProvider>
  );
};

export default CalendarPage;