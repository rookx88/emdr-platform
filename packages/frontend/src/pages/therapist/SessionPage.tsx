import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { phiService } from '../../services/phiService';
import './SessionPage.css';
import BilateralSimulation from '../../components/therapist/BilateralSimulation';
import TwilioVideo from '../../components/therapist/TwilioVideo';

// Define the params type for this route
type SessionPageParams = {
  sessionId: string;
};

// Mock session data for development
const createMockSession = (sessionId: string) => ({
  id: sessionId,
  title: `Session ${sessionId.substring(0, 8)}`,
  status: 'SCHEDULED',
  sessionType: 'EMDR',
  notes: '',
  creatorId: '', // Will be updated with actual user ID
  scheduledAt: new Date().toISOString(),
});

// Component to handle the EMDR therapy session page
const SessionPage: React.FC = () => {
  // Use the params with the appropriate type
  const { sessionId } = useParams() as SessionPageParams;
  const navigate = useNavigate();
  
  // Get the current user's info from auth context
  const { user } = useAuth();
  
  // State for storing session data
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Twilio video states
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  
  // State for bilateral stimulation
  const [stimulationActive, setStimulationActive] = useState(false);
  const [stimulationSpeed, setStimulationSpeed] = useState(1000);
  const [stimulationDirection, setStimulationDirection] = useState('horizontal' as 'horizontal' | 'vertical' | 'diagonal');

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/therapist/session/${sessionId}` } });
    }
  }, [user, navigate, sessionId]);
  
  // Load session data on component mount
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        
        // Since the GET /sessions/:id endpoint might not exist,
        // we'll use a mock session or try to load session notes
        let sessionData;
        
        try {
          // Try to get the session data if the endpoint exists
          const response = await api.get(`/sessions/${sessionId}`);
          sessionData = response.data;
        } catch (err) {
          console.log('Session fetch failed, using mock data instead');
          // Create mock session data
          sessionData = createMockSession(sessionId);
          
          // If we have a user, set it as the creator
          if (user) {
            sessionData.creatorId = user.id;
          }
          
          // Try to get session notes to populate the session data
          try {
            const notesResponse = await api.get(`/sessions/notes/${sessionId}`);
            if (notesResponse.data && notesResponse.data.notes && notesResponse.data.notes.length > 0) {
              // Get the most recent note
              const latestNote = notesResponse.data.notes[0];
              sessionData.notes = latestNote.content;
            }
          } catch (notesErr) {
            console.log('Could not fetch session notes');
          }
        }
        
        // Process the session data
        const processedData = await phiService.processDisplayObject(
          sessionData,
          true, // should detokenize
          'Viewing therapy session' // purpose
        );
        
        setSession(processedData);
        setNotes(processedData.notes || '');
        
        // Get Twilio token for video session
        try {
          const tokenResponse = await api.post('/sessions/token', {
            sessionId
          });
          
          if (tokenResponse.data && tokenResponse.data.token) {
            setToken(tokenResponse.data.token);
            setRoomName(tokenResponse.data.roomName);
          }
        } catch (tokenErr) {
          console.error('Failed to get video token:', tokenErr);
          // Continue without video if token fails
        }
        
      } catch (err: unknown) {
        console.error('Error fetching session data:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId && user) {
      fetchSessionData();
    }
    
    // Cleanup function to handle leaving the session
    return () => {
      // Handle cleanup if session is active
      if (roomName) {
        api.post('/sessions/room/end', {
          sessionId,
          roomName
        }).catch((err: unknown) => console.error('Error ending session:', err));
      }
    };
  }, [sessionId, user]);

  // Handler for updating notes
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  // Handler for saving notes
  const handleSaveNotes = async () => {
    try {
      await api.post('/sessions/notes', {
        content: notes,
        sessionId
      });
      alert('Notes saved successfully');
    } catch (err: unknown) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    }
  };
  
  // Transcription and AI notes functions
  const handleTranscriptionUpdate = (newText: string) => {
    setTranscript(prevTranscript => {
      const updatedTranscript = prevTranscript ? `${prevTranscript}\n${newText}` : newText;
      // After transcript update, generate AI notes
      generateAiNotes(updatedTranscript);
      return updatedTranscript;
    });
  };
  
  const generateAiNotes = (transcriptText: string) => {
    // This is a placeholder for real AI processing
    // In a production app, this would call an API endpoint
    setTimeout(() => {
      // Simple mock AI that just extracts sentences with "important" words
      const importantWords = ['trauma', 'memory', 'feeling', 'emotion', 'experience', 'trigger'];
      const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      const importantSentences = sentences.filter(sentence => 
        importantWords.some(word => sentence.toLowerCase().includes(word))
      );
      
      if (importantSentences.length > 0) {
        setAiNotes(importantSentences.join('. ') + '.');
      }
    }, 1000);
  };
  
  // Simulate transcript generation every few seconds (for demo purposes)
  useEffect(() => {
    if (!loading && session) {
      const demoTranscriptPhrases = [
        "Client is discussing childhood memories.",
        "Therapist asks about emotional response to the memory.",
        "Client reports feeling anxious when recalling the event.",
        "Therapist suggests focusing on that feeling during bilateral stimulation.",
        "Client notes decreased intensity of emotion after EMDR set.",
        "Therapist asks about any physical sensations associated with the memory.",
        "Client identifies tension in shoulders has decreased.",
        "Therapist suggests another set focusing on remaining discomfort."
      ];
      
      let index = 0;
      const intervalId = setInterval(() => {
        if (index < demoTranscriptPhrases.length) {
          handleTranscriptionUpdate(demoTranscriptPhrases[index]);
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, 8000); // Add a new line every 8 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [loading, session]);

  // Handler for completing the session
  const handleCompleteSession = async () => {
    try {
      // Save final notes
      await api.post('/sessions/notes', {
        content: notes,
        sessionId
      });
      
      // Try to update session status if that endpoint exists
      try {
        await api.put(`/sessions/${sessionId}`, {
          status: 'COMPLETED',
          endedAt: new Date().toISOString()
        });
      } catch (updateErr) {
        console.warn('Could not update session status:', updateErr);
        // Continue even if update fails
      }
      
      // Navigate back to therapist dashboard
      navigate('/therapist');
    } catch (err: unknown) {
      console.error('Error completing session:', err);
      alert('Failed to complete session');
    }
  };
  
  // Helper functions 
  const handleVideoError = (error: Error) => {
    console.error('Twilio video error:', error);
    setError('Failed to connect to video session. Please try again.');
  };
  
  // State for scheduling modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handler for opening scheduling modal
  const handleScheduleNext = () => {
    setShowScheduleModal(true);
  };

  // Handler for closing scheduling modal
  const handleCloseModal = () => {
    setShowScheduleModal(false);
  };

  // Handler for submitting billing
  const handleSubmitBilling = () => {
    // Future implementation - billing submission
    alert('Billing submission will be implemented in future release');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
        <button className="error-button" onClick={() => navigate('/therapist')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="session-container">
      {/* Session Header */}
      <header className="session-header">
        <div className="flex justify-between items-center">
          <h1 className="session-title">
            Session: {session && session.title ? session.title : `Session ${sessionId.substring(0, 8)}`}
          </h1>
          <button 
            onClick={() => navigate('/therapist')}
            className="exit-button"
          >
            Exit Session
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="session-content">
        {/* Left Column - Transcript and AI Notes */}
        <div className="column-left">
          {/* Transcript Panel */}
          <div className="panel split-panel">
            <div className="panel-header">Transcript</div>
            <div className="split-panel-content">
              {transcript || 'Session transcript will appear here...'}
            </div>
          </div>
          
          {/* AI Notes Panel */}
          <div className="panel split-panel">
            <div className="panel-header">AI Assisted Notes</div>
            <div className="split-panel-content">
              {aiNotes || 'AI-suggested notes will appear here...'}
            </div>
          </div>
        </div>
        
        {/* Center Column - Video and Notes */}
        <div className="column-center">
          {/* Video Panel */}
          <div className="video-container video-panel">
            {/* Twilio Video Component */}
            <TwilioVideo 
              token={token || undefined}
              roomName={roomName || undefined}
              onError={handleVideoError}
            />
            
            {/* Video Controls */}
            <div className="video-controls">
              <button className="video-control-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
              <button className="video-control-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </button>
              <button className="video-control-button end">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Therapist Notes Panel */}
          <div className="panel notes-panel">
            <div className="panel-header">Therapist Notes</div>
            <div className="panel-content">
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={handleNotesChange}
                placeholder="Enter session notes here..."
              ></textarea>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="save-button"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Bilateral Stimulation and Command Panel */}
        <div className="column-right">
          {/* Bilateral Stimulation Panel */}
          <div className="panel bilateral-panel">
            <BilateralSimulation 
              active={stimulationActive}
              speed={stimulationSpeed}
              direction={stimulationDirection}
              onSpeedChange={(speed) => setStimulationSpeed(speed)}
              onDirectionChange={(dir) => setStimulationDirection(dir)}
            />
          </div>
          
          {/* Command Panel */}
          <div className="panel command-panel">
            <div className="panel-header">Command Panel</div>
            <div className="panel-content">
              <button
                onClick={handleScheduleNext}
                className="command-button secondary"
              >
                Schedule Next
              </button>
              <button
                onClick={handleCompleteSession}
                className="command-button"
              >
                Complete Notes
              </button>
              <button
                onClick={handleSubmitBilling}
                className="command-button"
              >
                Submit Billing
              </button>
            </div>
          </div>
          
          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="modal-title">Schedule Next Session</div>
                  <button className="modal-close" onClick={handleCloseModal}>&times;</button>
                </div>
                <form className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input type="time" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Type</label>
                    <select className="form-select">
                      <option value="EMDR">EMDR</option>
                      <option value="STANDARD">Standard</option>
                      <option value="FOLLOWUP">Follow-up</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <select className="form-select">
                      <option value="30">30 minutes</option>
                      <option value="50" selected>50 minutes</option>
                      <option value="80">80 minutes</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                    <button type="button" className="btn-submit">Schedule</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPage;