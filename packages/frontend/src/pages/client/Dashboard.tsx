// src/pages/client/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [therapistName, setTherapistName] = useState('Dr. Smith');
  
  // Simulated data loading - would be replaced with actual API calls
  useEffect(() => {
    // This would be an API call to fetch client data including therapist info
  }, []);
  
  const upcomingSessions = [
    { id: 1, date: '2025-04-27T14:00:00', type: 'EMDR Session' },
    { id: 2, date: '2025-05-04T10:30:00', type: 'Follow-up' },
  ];
  
  const resources = [
    { id: 1, title: 'Understanding EMDR Therapy', type: 'Article', isNew: true },
    { id: 2, title: 'Relaxation Techniques', type: 'Video', isNew: false },
    { id: 3, title: 'Self-Care Guide', type: 'PDF', isNew: false },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome Back!</h1>
        <div className="text-sm text-gray-600">
          Hello, {user?.firstName || user?.email}
        </div>
      </div>
      
      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Therapist</h2>
            <p className="text-indigo-100">{therapistName}</p>
            <div className="mt-4">
              <button className="px-4 py-2 bg-white text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors">
                Send Message
              </button>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <h2 className="text-xl font-semibold mb-2">Next Session</h2>
            {upcomingSessions.length > 0 ? (
              <>
                <p className="text-indigo-100">
                  {new Date(upcomingSessions[0].date).toLocaleDateString()} at{' '}
                  {new Date(upcomingSessions[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-indigo-100">{upcomingSessions[0].type}</p>
              </>
            ) : (
              <p className="text-indigo-100">No upcoming sessions scheduled</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingSessions.map(session => (
            <div key={session.id} className="px-6 py-4">
              <div className="font-medium text-gray-900">{session.type}</div>
              <div className="text-sm text-gray-600">
                {new Date(session.date).toLocaleDateString()} at{' '}
                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {upcomingSessions.length === 0 && (
            <div className="px-6 py-4 text-gray-600">
              No upcoming sessions scheduled.
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50">
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View All Sessions
          </button>
        </div>
      </div>
      
      {/* Resources */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Resources From Your Therapist</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {resources.map(resource => (
            <div key={resource.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {resource.title}
                  {resource.isNew && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{resource.type}</div>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View
              </button>
            </div>
          ))}
          
          {resources.length === 0 && (
            <div className="px-6 py-4 text-gray-600">
              No resources available yet.
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50">
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View All Resources
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;