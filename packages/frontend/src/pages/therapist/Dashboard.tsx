// packages/frontend/src/pages/therapist/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [nextSession, setNextSession] = useState<any>(null);
  const [specialtyUpdates, setSpecialtyUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepAreaContent, setPrepAreaContent] = useState<React.ReactNode | null>(null);
  
  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch next session data
      const response = await api.get('/appointments', {
        params: {
          startDate: new Date().toISOString(),
          status: 'SCHEDULED,CONFIRMED',
          limit: 1
        }
      });
      
      if (response.data && response.data.length > 0) {
        setNextSession(response.data[0]);
      }
      
      // Fetch specialty updates - this would be replaced with actual API integration
      setSpecialtyUpdates([
        {
          id: 1,
          source: "EMDR International",
          title: "New research shows EMDR therapy effectiveness for trauma treatment",
          content: "Recent studies confirm bilateral stimulation continues to show positive outcomes in PTSD treatment.",
          date: new Date()
        },
        {
          id: 2,
          source: "Trauma Research Center",
          title: "Bilateral stimulation techniques show promising results",
          content: "Clinical trials demonstrate significant improvement in anxiety reduction using modern EMDR approaches.",
          date: new Date()
        }
      ]);
      
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard information');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrepClick = () => {
    if (!nextSession) return;
    
    // Load client recap info into prep area
    setPrepAreaContent(
      <div className="client-recap p-6">
        <h3 className="text-xl font-semibold mb-4">Session Preparation</h3>
        <div className="client-info mb-4">
          <h4 className="text-lg font-medium">Client: {nextSession.client?.user.firstName} {nextSession.client?.user.lastName}</h4>
          <p className="text-gray-600">Last session: {new Date(nextSession.startTime).toLocaleDateString()}</p>
        </div>
        <div className="session-notes">
          <h4 className="text-md font-medium mb-2">Previous Session Notes:</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            Client reported reduced anxiety levels. Continued work on bilateral stimulation exercises.
            Homework completed. Ready to proceed to next phase of treatment.
          </p>
        </div>
      </div>
    );
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex">
      {/* Main Content Area */}
      <div className="flex-grow mr-4">
        {/* Header with greeting */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {getGreeting()}, {user?.firstName || 'Therapist'}
        </h1>
        
        {/* Specialty Updates Section - Purple area in mockup */}
        <div className="bg-purple-500 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Latest in EMDR Therapy</h2>
          <div className="space-y-3">
            {specialtyUpdates.map(update => (
              <div key={update.id} className="bg-purple-300 bg-opacity-50 p-3 rounded">
                <h3 className="font-medium text-white">{update.title}</h3>
                <p className="text-white mt-1">{update.content}</p>
                <p className="text-sm text-purple-100 mt-1">Source: {update.source}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Three Tiles Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Next Session Tile */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Next Session</h3>
            {nextSession ? (
              <div>
                <p className="font-medium">{nextSession.client?.user.firstName} {nextSession.client?.user.lastName}</p>
                <p className="text-gray-600">{formatTime(nextSession.startTime)}</p>
                <p className="text-gray-600 text-sm mb-2">
                  (in {Math.round((new Date(nextSession.startTime).getTime() - new Date().getTime()) / 60000)} minutes)
                </p>
                <div className="flex mt-2 space-x-2">
                  <Link
                    to={`/therapist/session/${nextSession.id}`}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  >
                    Join Session
                  </Link>
                  <button
                    onClick={handlePrepClick}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-200"
                  >
                    Prep
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No upcoming sessions</p>
            )}
          </div>
          
          {/* Notifications Tile */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Notifications</h3>
            <p className="text-gray-500 text-sm">Coming soon</p>
          </div>
          
          {/* Business Center Tile */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Business Center</h3>
            <p className="text-gray-500 text-sm">Coming soon</p>
          </div>
        </div>
        
        {/* Prep Area (Pink area in mockup) */}
        <div className="bg-pink-200 rounded-lg p-4 border border-pink-300 min-h-[200px]">
          {prepAreaContent || (
            <div className="text-center text-pink-500 py-10">
              <p>Click "Prep" on your next session to see client information and session notes</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className={`bg-yellow-100 w-64 p-4 h-full rounded-lg transition-all duration-300 ${sidebarExpanded ? 'block' : 'hidden'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Day at a Glance</h2>
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {sidebarExpanded ? '→' : '←'}
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-gray-700">Monday, May 5</h3>
          <p className="text-sm text-gray-600 mt-2">No appointments scheduled for today</p>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-2">Priority Items</h3>
          <p className="text-gray-600 text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;