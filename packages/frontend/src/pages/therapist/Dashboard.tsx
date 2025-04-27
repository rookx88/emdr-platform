// src/pages/therapist/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    pendingTasks: 0
  });
  
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
          
          <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;