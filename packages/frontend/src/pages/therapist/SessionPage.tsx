// packages/frontend/src/pages/therapist/SessionPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionProvider } from '../../context/SessionContext';
import VideoSession from '../../components/therapist/VideoSession';
import axios from 'axios';

const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setError('Session ID is required');
        setLoading(false);
        return;
      }
      
      try {
        // This is a placeholder for fetching actual session data
        // In a real implementation, you would fetch the session from your API
        // const response = await axios.get(`/api/sessions/${sessionId}`);
        // setSessionData(response.data);
        
        // For now, we'll create a mock session
        setSessionData({
          id: sessionId,
          title: `Session ${sessionId}`,
          scheduledAt: new Date(),
          status: 'SCHEDULED'
        });
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message || 'Failed to fetch session data');
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);
  
  // Check if user is authorized to access this session
  useEffect(() => {
    if (!loading && !sessionData) {
      navigate('/therapist/sessions');
    }
  }, [loading, sessionData, navigate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/therapist/sessions')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }
  
  if (!sessionData) {
    return null;
  }
  
  return (
    <SessionProvider>
      <VideoSession sessionId={sessionId || ''} />
    </SessionProvider>
  );
};

export default SessionPage;