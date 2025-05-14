// packages/frontend/src/pages/therapist/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import dashboardBackground from '../../assets/Dashboardbackdrop.svg';


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
        <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
          {getGreeting()}, {user?.firstName || 'Therapist'}
        </h1>
        
        {/* Specialty Updates Section - Purple area in mockup */}
        <div className="bg-[#f0d890] border-2 border-[#e6c870] rounded-lg p-4 mb-6 shadow-md">
          <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif", textShadow: '-1px -1px 0 #B8860B, 1px -1px 0 #B8860B, -1px 1px 0 #B8860B, 1px 1px 0 #B8860B' }}>Latest in Therapy</h2>
          <div className="space-y-3">
            {specialtyUpdates.map(update => (
              <div key={update.id} className="bg-[#f1f5f9] border border-[#e6c870] p-3 rounded">
                <h3 className="font-medium text-black" style={{ fontFamily: "'Playfair Display', serif" }}>{update.title}</h3>
                <p className="text-black mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>{update.content}</p>
                <p className="text-sm text-black-100 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>Source: {update.source}</p>
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
<div className={`bg-blue-100/30 border border-blue-200 rounded-lg transition-all duration-300 flex ${sidebarExpanded ? 'w-64' : 'w-8'}`}>
  {/* This is the main sidebar content that shows/hides */}
  {sidebarExpanded && (
    <div className="flex-grow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Day at a Glance</h2>
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
  )}
  
  {/* Toggle button that's always visible */}
  <div className="flex items-center">
    <button 
      onClick={() => setSidebarExpanded(!sidebarExpanded)}
      className="text-gray-700 hover:text-gray-900 h-full px-1 flex items-center justify-center"
      aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {sidebarExpanded ? '→' : '←'}
    </button>
  </div>
</div>

      {/* Background Image */}
      
      <div 
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, #FFFFFF, #FFF5E6)', // Gradient from white to egg color
    zIndex: -1 // Set to negative to ensure it stays behind other content
  }} 
/>

    </div>
  );
};

export default TherapistDashboard;