// packages/frontend/src/components/calendar/CalendarDayView.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CalendarDayView: React.FC = () => {
  const { user } = useAuth();
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTodayEvents();
  }, []);
  
  const fetchTodayEvents = async () => {
    setLoading(true);
    
    try {
      // Get today's start and end dates
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      // Fetch today's appointments
      const response = await api.get('/appointments', {
        params: {
          startDate: startOfDay,
          endDate: endOfDay
        }
      });
      
      setTodayEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch today\'s events:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if event is current or upcoming
  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };
  
  // Sort events by start time
  const sortedEvents = [...todayEvents].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin w-6 h-6 border-t-2 border-b-2 border-yellow-600 rounded-full mx-auto"></div>
        <p className="text-sm mt-2">Loading events...</p>
      </div>
    );
  }
  
  return (
    <div className="calendar-day-view">
      <div className="text-center mb-3">
        <h3 className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
      </div>
      
      {sortedEvents.length > 0 ? (
        <div className="space-y-2">
          {sortedEvents.map(event => (
            <div 
              key={event.id} 
              className={`p-2 rounded text-sm ${
                isUpcoming(event.startTime) 
                  ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                  : 'bg-gray-100'
              }`}
            >
              <div className="font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
              <div>{event.client?.user.firstName} {event.client?.user.lastName}</div>
              <div className="text-xs text-gray-600">{event.type} Session</div>
              
              {isUpcoming(event.startTime) && (
                <Link 
                  to={`/therapist/session/${event.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                >
                  Join →
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No appointments scheduled for today
        </div>
      )}
    </div>
  );
};

export default CalendarDayView;