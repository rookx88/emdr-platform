// packages/frontend/src/pages/therapist/SessionPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionProvider, useSession } from '../../context/SessionContext';

// Import individual components
import VideoPanel from '../../components/therapist/VideoPanel';
import BilateralStimulation from '../../components/therapist/BilateralSimulation';
import TranscriptPanel from '../../components/therapist/TranscriptPanel';
import NotesPanel from '../../components/therapist/NotesPanel';

// Import CSS Module
import styles from './SessionPage.module.css';

// Panel container component for consistent styling
const PanelContainer: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className={styles.panelContainer}>
    <div className={styles.panelHeader}>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    <div className={styles.panelContent}>
      {children}
    </div>
  </div>
);

// Main SessionPage component
const SessionPageContent: React.FC = () => {
  const params = useParams();
  const sessionId = params.sessionId;
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const sessionInitializedRef = useRef(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    startSession,
    endSession,
    room,
    isConnecting,
    isRecording,
    startRecording,
    stopRecording,
    transcriptions,
    notes,
    saveNote,
    participants,
  } = useSession();
  
  // Fetch session data
  useEffect(() => {
    let isMounted = true;
    
    const fetchSessionData = async () => {
      if (!sessionId) {
        if (isMounted) {
          setError('Session ID is required');
          setLoading(false);
        }
        return;
      }
      
      // Prevent duplicate initialization
      if (sessionInitializedRef.current) {
        console.log('Session already initialized, skipping');
        return;
      }
      
      sessionInitializedRef.current = true;
      
      try {
        // Placeholder for real API call
        if (isMounted) {
          setSessionData({
            id: sessionId,
            title: `Session ${sessionId}`,
            scheduledAt: new Date(),
            status: 'SCHEDULED'
          });
        }
        
        // Initialize session
        if (isMounted) {
          try {
            await startSession(sessionId);
          } catch (connectError) {
            // We'll still consider the session loaded even if the video connection fails
            console.warn('Error connecting to video, but session data was loaded:', connectError);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching session:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch session data');
          setLoading(false);
        }
      }
    };
    
    fetchSessionData();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      
      // Only end the session if it was initialized
      if (sessionInitializedRef.current) {
        console.log('Cleaning up session on unmount');
        endSession().catch(console.error);
      }
    };
  }, [sessionId, startSession, endSession]);
  
  // Check if user is authorized to access this session
  useEffect(() => {
    if (!loading && !sessionData) {
      navigate('/therapist/sessions');
    }
  }, [loading, sessionData, navigate]);
  
  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  
  // Handle note submission
  const handleNoteSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (noteContent.trim()) {
      saveNote(noteContent);
      setNoteContent('');
    }
  }, [noteContent, saveNote]);
  
  // Format session ID
  const formattedSessionId = sessionId ? (
    sessionId.includes('-') 
      ? sessionId 
      : `${sessionId.slice(0, 8)}-${sessionId.slice(8, 12)}-${sessionId.slice(12, 16)}-${sessionId.slice(16, 20)}-${sessionId.slice(20)}`
  ) : '';
  
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
    <div className={styles.sessionPage}>
      {/* Side control bar */}
      <div className={styles.controlBar}>
        <button className="text-white p-2 rounded hover:bg-gray-700">
          <span className="text-2xl">📹</span>
        </button>
      </div>
      
      {/* Main content */}
      <div className={styles.mainContent}>
        <div className="flex flex-col w-full">
          {/* Session controls */}
          <div className={styles.sessionControls}>
            <h1 className="text-lg font-semibold">Session: {formattedSessionId}</h1>
            <div>
              <button
                onClick={toggleRecording}
                className="px-3 py-1 bg-gray-200 rounded-md text-gray-800 mr-2"
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button
                onClick={() => {
                  // Only attempt to end the session once
                  if (sessionInitializedRef.current) {
                    sessionInitializedRef.current = false;
                    endSession().then(() => {
                      navigate('/therapist/sessions');
                    }).catch(console.error);
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-md"
              >
                End Session
              </button>
            </div>
          </div>
          
          {/* Grid layout for the session interface */}
          <div className={styles.gridLayout}>
            {/* Left side - Video feeds */}
            <div className={styles.videoColumn}>
              <div className={styles.videoContainer}>
                {/* Main client video */}
                <div className={styles.mainVideo}>
                  <VideoPanel 
                    isTherapist={false} 
                    participants={participants} 
                    isMainView={true}
                  />
                </div>
                
                {/* Therapist video thumbnail - overlaid on main video */}
                <div className={styles.thumbnailVideo}>
                  <VideoPanel 
                    isTherapist={true} 
                    isConnecting={isConnecting} 
                    isMainView={false}
                  />
                </div>
              </div>
            </div>
            
            {/* Right side - Tools grid */}
            <div className={styles.toolsGrid}>
              {/* Top row of tools */}
              <div className={styles.toolRow}>
                {/* Bilateral Stimulation */}
                <div>
                  <PanelContainer title="Bilateral Stimulation">
                    <BilateralStimulation />
                  </PanelContainer>
                </div>
                
                {/* Transcript */}
                <div>
                  <PanelContainer title="Transcript">
                    <TranscriptPanel transcriptions={transcriptions} />
                  </PanelContainer>
                </div>
              </div>
              
              {/* Bottom row of tools */}
              <div className={styles.toolRow}>
                {/* AI-Assisted Notes */}
                <div>
                  <PanelContainer title="AI-Assisted Notes">
                    <div className="mb-4">
                      <h3 className="font-medium mb-1">Key Observations:</h3>
                      <ul className="list-disc pl-6 text-sm">
                        <li>Client showed reduced anxiety when discussing [topic]</li>
                        <li>Progress noted in bilateral processing</li>
                        <li>Consider follow-up on resources discussed</li>
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium mb-1">Suggested Topics:</h3>
                      <ul className="list-disc pl-6 text-sm">
                        <li>Explore connection between [event] and current symptoms</li>
                        <li>Discuss coping strategies for [situation]</li>
                      </ul>
                    </div>
                  </PanelContainer>
                </div>
                
                {/* Therapist Notes */}
                <div>
                  <PanelContainer title="Therapist Notes">
                    <NotesPanel
                      notes={notes}
                      noteContent={noteContent}
                      setNoteContent={setNoteContent}
                      handleNoteSubmit={handleNoteSubmit}
                    />
                  </PanelContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionPage: React.FC = () => {
  return (
    <SessionProvider>
      <SessionPageContent />
    </SessionProvider>
  );
};

export default SessionPage;