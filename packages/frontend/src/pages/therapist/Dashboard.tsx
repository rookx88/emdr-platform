// src/pages/therapist/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeClients: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    pendingTasks: 0
  });
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Simulated data loading - would be replaced with actual API calls
  useEffect(() => {
    // Mock data fetch
    const fetchData = () => {
      setStats({
        activeClients: 12,
        upcomingSessions: 5,
        completedSessions: 45,
        pendingTasks: 3
      });
    };
    
    fetchData();
  }, []);
  
  const upcomingSessions = [
    { id: 1, client: 'Jane Doe', date: '2025-04-27T14:00:00', type: 'EMDR' },
    { id: 2, client: 'John Smith', date: '2025-04-28T10:30:00', type: 'Assessment' },
    { id: 3, client: 'Anna Johnson', date: '2025-04-29T15:45:00', type: 'EMDR' },
  ];
  
  // Function to create a test session
  // Updated createTestSession function for TherapistDashboard.tsx
const createTestSession = async () => {
  try {
    setIsCreatingSession(true);
    
    // Get token from context if available - your useAuth hook might provide this
    const token = localStorage.getItem('token'); // Temporary fallback if needed
    
    const response = await axios.post('/api/sessions', {
      title: `Test Session ${new Date().toLocaleTimeString()}`,
      scheduledAt: new Date().toISOString(),
      sessionType: 'EMDR'
    }, {
      withCredentials: true, // This sends cookies
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header as fallback
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    console.log('Session created:', response.data);
    
    // Navigate to the new session
    navigate(`/therapist/session/${response.data.id}`);
  } catch (error) {
    console.error('Failed to create test session:', error);
    // More detailed error message
    const errorMessage = (error as any).response?.data?.message || (error as any).message || 'Unknown error';
    alert(`Failed to create test session: ${errorMessage}`);
  } finally {
    setIsCreatingSession(false);
  }
};
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Therapist Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, {user?.firstName || user?.email}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Active Clients</div>
          <div className="mt-2 text-3xl font-semibold text-indigo-600">{stats.activeClients}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Upcoming Sessions</div>
          <div className="mt-2 text-3xl font-semibold text-green-600">{stats.upcomingSessions}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Completed Sessions</div>
          <div className="mt-2 text-3xl font-semibold text-blue-600">{stats.completedSessions}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Pending Tasks</div>
          <div className="mt-2 text-3xl font-semibold text-orange-600">{stats.pendingTasks}</div>
        </div>
      </div>
      
      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingSessions.map(session => (
            <div key={session.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{session.client}</div>
                <div className="text-sm text-gray-600">
                  {new Date(session.date).toLocaleString()} • {session.type}
                </div>
              </div>
              <div>
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View Details
                </button>
              </div>
            </div>
          ))}
          
          {upcomingSessions.length === 0 && (
            <div className="px-6 py-4 text-gray-600">
              No upcoming sessions scheduled.
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">📝</span>
            <span className="text-sm font-medium">Schedule Session</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium">Add New Client</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">🧰</span>
            <span className="text-sm font-medium">EMDR Tools</span>
          </button>
          
          {/* New Test Session Button */}
          <button 
            onClick={createTestSession}
            disabled={isCreatingSession}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors relative overflow-hidden"
          >
            {/* Orange button styling to match login button */}
            <div className="absolute inset-0 bg-amber-600 opacity-10"></div>
            <span className="text-2xl mb-2">🧪</span>
            <span className="text-sm font-medium relative z-10">
              {isCreatingSession ? 'Creating...' : 'Test Video Session'}
            </span>
            {isCreatingSession && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-lg shadow-lg p-6 text-white">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Ready to test the EMDR video system?</h3>
            <p className="mt-2 text-amber-100">Create a test session to explore the video interface, bilateral stimulation tools, and note-taking features.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={createTestSession}
              disabled={isCreatingSession}
              className="inline-flex items-center px-4 py-2 border border-white bg-white text-amber-600 text-sm font-medium rounded-md shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white"
            >
              {isCreatingSession ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Session...
                </>
              ) : (
                'Start Test Session'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;