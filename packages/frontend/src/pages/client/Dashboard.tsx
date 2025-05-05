// packages/frontend/src/pages/client/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch client profile with therapist info
      const profileResponse = await api.get('/clients/me');
      setClientProfile(profileResponse.data);
      
      // Fetch upcoming appointments
      const appointmentsResponse = await api.get('/appointments', {
        params: {
          startDate: new Date().toISOString(),
          status: 'active'
        }
      });
      setUpcomingSessions(appointmentsResponse.data);
      
      // Mock data for resources and notifications for now
      // These would be replaced with actual API calls in production
      setResources([
        { id: 1, title: 'Understanding EMDR Therapy', type: 'Article', isNew: true },
        { id: 2, title: 'Relaxation Techniques', type: 'Video', isNew: false },
        { id: 3, title: 'Coping Strategies Guide', type: 'PDF', isNew: false },
        { id: 4, title: 'Weekly Self-Care Checklist', type: 'Worksheet', isNew: true }
      ]);
      
      setNotifications([
        { id: 1, type: 'APPOINTMENT', message: 'Your session is tomorrow at 2:00 PM', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        { id: 2, type: 'MESSAGE', message: 'Dr. Smith shared new resources with you', date: new Date() }
      ]);
      
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard information');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to format time
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Get next session
  const nextSession = upcomingSessions && upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-xl overflow-hidden mb-8">
        <div className="px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || user?.email.split('@')[0]}
          </h1>
          <p className="mt-2 text-indigo-100">
            Today is {formatDate(new Date())}
          </p>
          
          {nextSession ? (
            <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4">
              <p className="text-sm font-medium text-indigo-100">Your next session is:</p>
              <div className="flex justify-between items-center mt-2">
                <div>
                  <h3 className="text-xl font-semibold">
                    {nextSession.type} Session
                  </h3>
                  <p className="text-indigo-100">
                    {formatDate(nextSession.startTime)} at {formatTime(nextSession.startTime)}
                  </p>
                </div>
                <Link
                  to={`/client/session/${nextSession.id}`}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-md font-medium hover:bg-indigo-50"
                >
                  Join Session
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-indigo-100">You don't have any upcoming sessions.</p>
              <Link
                to="/client/appointments?booking=true"
                className="mt-3 inline-block px-4 py-2 bg-white text-indigo-700 rounded-md font-medium hover:bg-indigo-50"
              >
                Schedule a Session
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
              <Link 
                to="/client/appointments"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingSessions && upcomingSessions.length > 0 ? (
                upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.title || session.type}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(session.startTime)} • {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                        {session.therapist && (
                          <p className="mt-1 text-sm text-gray-500">
                            With {session.therapist.user.firstName} {session.therapist.user.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        <Link
                          to={`/client/session/${session.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Join
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">You don't have any upcoming sessions.</p>
                  <Link
                    to="/client/appointments?booking=true"
                    className="mt-3 inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Schedule Now
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link
                  to="/client/appointments?booking=true"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-3xl mb-2">📅</span>
                  <span className="text-sm text-center text-gray-700">Book Session</span>
                </Link>
                
                <Link
                  to="/client/profile"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-3xl mb-2">👤</span>
                  <span className="text-sm text-center text-gray-700">My Profile</span>
                </Link>
                
                <Link
                  to="/client/resources"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-3xl mb-2">📚</span>
                  <span className="text-sm text-center text-gray-700">Resources</span>
                </Link>
                
                <Link
                  to="/client/tools"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-3xl mb-2">🧠</span>
                  <span className="text-sm text-center text-gray-700">Self-Help Tools</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Therapy Progress */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Therapy Journey</h2>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-0 top-0 h-full w-1 bg-indigo-100"></div>
                
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-0 rounded-full h-6 w-6 bg-indigo-600 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Started Therapy</h3>
                  <p className="text-sm text-gray-500">April 10, 2025</p>
                </div>
                
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-0 rounded-full h-6 w-6 bg-indigo-600 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">First EMDR Session</h3>
                  <p className="text-sm text-gray-500">April 17, 2025</p>
                </div>
                
                <div className="relative pl-8">
                  <div className="absolute left-0 top-0 rounded-full h-6 w-6 bg-indigo-100 border-2 border-indigo-600 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Next Milestone</h3>
                  <p className="text-sm text-gray-500">In progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Therapist Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Therapist</h2>
            </div>
            <div className="p-6">
              {clientProfile?.therapist ? (
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-4xl text-indigo-600">
                    {clientProfile.therapist.user.firstName?.charAt(0) || ''}
                    {clientProfile.therapist.user.lastName?.charAt(0) || ''}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {clientProfile.therapist.user.firstName || ''} {clientProfile.therapist.user.lastName || ''}
                  </h3>
                  <p className="text-sm text-gray-500">EMDR Therapist</p>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => window.open(`mailto:${clientProfile.therapist.user.email}`)}
                      className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Message
                    </button>
                    <Link
                      to="/client/appointments?booking=true"
                      className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Schedule
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No therapist assigned yet.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Resources */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Resources</h2>
              <Link 
                to="/client/resources"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <div key={resource.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {resource.title}
                        {resource.isNew && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500">{resource.type}</p>
                    </div>
                    <Link
                      to={`/client/resources/${resource.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50">
                    <div className="flex">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        notification.type === 'APPOINTMENT' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {notification.type === 'APPOINTMENT' ? '📅' : '✉️'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;