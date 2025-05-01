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
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Side control bar - camera icon */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-gray-800 flex flex-col items-center pt-8">
        <button className="text-white p-2 rounded hover:bg-gray-700">
          <span className="text-2xl">📹</span>
        </button>
      </div>
      
      {/* Main content */}
      <div className="ml-16 flex-1 p-4">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md text-center mb-4">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Grid layout container to match wireframe */}
        <div className="border rounded-lg p-4">
          {/* Session controls */}
          <div className="flex justify-between mb-4">
            <h1 className="text-lg font-semibold">Session: {formattedSessionId}</h1>
            <div>
              <button
                onClick={toggleRecording}
                className="px-3 py-1 bg-gray-200 rounded-md text-gray-800 mr-2"
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button
                onClick={handleEndSession}
                className="px-3 py-1 bg-red-500 text-white rounded-md"
              >
                End Session
              </button>
            </div>
          </div>
          
          {/* Grid layout for videos and tools */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left side - Video feeds */}
            <div className="flex flex-col">
              {/* Main therapist video */}
              <div 
                className="bg-gray-100 rounded-lg h-80 mb-4 flex items-center justify-center"
                ref={localVideoRef}
              >
                {isConnecting && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Connecting...</p>
                  </div>
                )}
              </div>
              
              {/* Client video thumbnail */}
              <div 
                className="bg-gray-100 border border-gray-300 rounded-lg h-32"
                ref={remoteVideosRef}
              >
                {participants.size === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Waiting for client...
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Tools grid */}
            <div className="grid grid-rows-2 gap-4">
              {/* Top row of tools */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bilateral Stimulation */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">Bilateral Stimulation</h2>
                  <BilateralStimulation />
                </div>
                
                {/* Transcript */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">Transcript</h2>
                  <TranscriptPanel transcriptions={transcriptions} />
                </div>
              </div>
              
              {/* Bottom row of tools */}
              <div className="grid grid-cols-2 gap-4">
                {/* AI-Assisted Notes */}
                <div className="border rounded-lg p-4 overflow-auto">
                  <h2 className="text-lg font-semibold mb-2">AI-Assisted Notes</h2>
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
                </div>
                
                {/* Therapist Notes */}
                <div className="border rounded-lg p-4 overflow-auto">
                  <h2 className="text-lg font-semibold mb-2">Therapist Notes</h2>
                  <NotesPanel
                    notes={notes}
                    noteContent={noteContent}
                    setNoteContent={setNoteContent}
                    handleNoteSubmit={handleNoteSubmit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSession;