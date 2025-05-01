// packages/frontend/src/components/therapist/VideoSession.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import BilateralStimulation from './BilateralSimulation';
import TranscriptPanel from './TranscriptPanel';
import NotesPanel from './NotesPanel';

interface VideoSessionProps {
  sessionId: string;
}

const VideoSession: React.FC<VideoSessionProps> = ({ sessionId }) => {
  const {
    startSession,
    endSession,
    room,
    localTracks,
    participants,
    isConnecting,
    isRecording,
    startRecording,
    stopRecording,
    transcriptions,
    notes,
    saveNote,
    bilateralActive,
    bilateralSpeed,
    bilateralDirection,
    setBilateralSpeed,
    setBilateralDirection,
    toggleBilateralStimulation
  } = useSession();
  
  const { user } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  
  // Refs for video containers
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  
  // Start session on component mount
  useEffect(() => {
    if (sessionId) {
      const initSession = async () => {
        try {
          await startSession(sessionId);
        } catch (err: any) {
          console.error('Failed to start session:', err);
          setError(err.message || 'Failed to start session');
        }
      };
      
      initSession();
    }
    
    // Clean up on unmount
    return () => {
      endSession().catch(console.error);
    };
  }, [sessionId, startSession, endSession]);
  
  // Attach local video when local tracks change
  useEffect(() => {
    if (localTracks.length > 0 && localVideoRef.current) {
      // First clear any existing elements
      while (localVideoRef.current.firstChild) {
        localVideoRef.current.removeChild(localVideoRef.current.firstChild);
      }
      
      // Then attach new tracks
      localTracks.forEach(track => {
        // Type casting for LocalTrack
        const trackWithProperties = track as unknown as { 
          kind?: string;
          attach?: () => HTMLMediaElement;
          mediaStreamTrack?: MediaStreamTrack;
        };
        
        if (trackWithProperties.kind === 'video' && typeof trackWithProperties.attach === 'function') {
          const element = trackWithProperties.attach();
          element.style.width = '100%';
          element.style.height = '100%';
          element.style.objectFit = 'cover';
          localVideoRef.current?.appendChild(element);
        }
      });
    }
  }, [localTracks]);
  
  // Handle recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Handle note submission
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteContent.trim()) {
      saveNote(noteContent);
      setNoteContent('');
    }
  };
  
  // End session
  const handleEndSession = async () => {
    try {
      await endSession();
    } catch (err: any) {
      console.error('Failed to end session:', err);
    }
  };
  
  // Format session ID to match the screenshot
  const formattedSessionId = sessionId.includes('-') 
    ? sessionId 
    : `${sessionId.slice(0, 8)}-${sessionId.slice(8, 12)}-${sessionId.slice(12, 16)}-${sessionId.slice(16, 20)}-${sessionId.slice(20)}`;
  
  // Simplified style to match screenshot
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with HIPAA notice and copyright */}
      <header className="p-2 text-center text-sm text-gray-600">
        <div>HIPAA Compliant</div>
        <div>© 2025 EMDR Platform</div>
      </header>
      
      {/* Session title */}
      <h1 className="text-2xl font-bold text-center my-4">
        EMDR Therapy Session {formattedSessionId}
      </h1>
      
      {/* Recording controls */}
      <div className="flex justify-center mb-4">
        <button
          onClick={toggleRecording}
          className="px-3 py-1 bg-gray-200 rounded-md text-gray-800 mr-2"
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          onClick={handleEndSession}
          className="px-3 py-1 bg-gray-200 rounded-md text-gray-800"
        >
          End Session
        </button>
      </div>
      
      {/* Video section */}
      <div className="mx-auto w-full max-w-3xl px-4">
        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-center mb-8">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-700">{error}</p>
            <p className="mt-2 text-sm text-red-600">Request failed with status code 401</p>
          </div>
        ) : isConnecting ? (
          <div className="text-center p-8 mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Connecting to session...</p>
          </div>
        ) : (
          <div className="h-48 mb-8" ref={localVideoRef}>
            {/* Video will be attached here by the useEffect hook */}
          </div>
        )}
      </div>
      
      {/* Bilateral Stimulation */}
      <div className="mx-auto w-full max-w-3xl px-4 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">Bilateral Stimulation</h2>
        <BilateralStimulation />
      </div>
      
      {/* Transcript */}
      <div className="mx-auto w-full max-w-3xl px-4 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">Real-time Transcript</h2>
        <TranscriptPanel transcriptions={transcriptions} />
      </div>
      
      {/* AI-Assisted Notes */}
      <div className="mx-auto w-full max-w-3xl px-4 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">AI-Assisted Notes</h2>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Key Observations:</h3>
          <ul className="list-disc pl-8">
            <li>Client showed reduced anxiety when discussing [topic]</li>
            <li>Progress noted in bilateral processing</li>
            <li>Consider follow-up on resources discussed</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Suggested Topics:</h3>
          <ul className="list-disc pl-8">
            <li>Explore connection between [event] and current symptoms</li>
            <li>Discuss coping strategies for [situation]</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Session Summary Draft:</h3>
          <p>Session focused on processing [trigger]. Client demonstrated improved ability to maintain dual awareness during bilateral stimulation. Positive cognition "I am safe now" strengthened from VOC 3 to VOC 5.</p>
        </div>
      </div>
      
      {/* Therapist Notes */}
      <div className="mx-auto w-full max-w-3xl px-4 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">Therapist Notes</h2>
        <NotesPanel
          notes={notes}
          noteContent={noteContent}
          setNoteContent={setNoteContent}
          handleNoteSubmit={handleNoteSubmit}
        />
      </div>
    </div>
  );
};

export default VideoSession;