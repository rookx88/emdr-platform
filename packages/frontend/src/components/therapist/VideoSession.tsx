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
    saveNote
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
  
  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          EMDR Therapy Session {sessionId}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={toggleRecording}
            className={`px-4 py-2 rounded-md ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            End Session
          </button>
        </div>
      </div>
      
      {/* Main content - 4 panel layout */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        {/* Left column - Video and Notes */}
        <div className="flex flex-col w-full md:w-1/2 gap-4">
          {/* Video panel */}
          <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="h-full flex flex-col">
              {error ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-red-600 text-center p-4">
                    <h3 className="text-lg font-semibold">Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              ) : isConnecting ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Connecting to session...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                  {/* Local video */}
                  <div className="relative bg-gray-900 rounded overflow-hidden">
                    <div ref={localVideoRef} className="absolute inset-0"></div>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      You{user?.firstName ? ` (${user.firstName})` : ''}
                    </div>
                  </div>
                  
                  {/* Remote videos */}
                  <div ref={remoteVideosRef} className="bg-gray-900 rounded overflow-hidden">
                    {participants.size === 0 ? (
                      <div className="h-full flex items-center justify-center text-white">
                        Waiting for participants...
                      </div>
                    ) : (
                      Array.from(participants.values()).map(participant => (
                        <div
                          key={participant.identity}
                          id={`participant-${participant.identity}`}
                          className="relative h-full"
                        >
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {participant.identity}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notes panel */}
          <div className="h-1/3 bg-white rounded-lg shadow">
            <NotesPanel
              notes={notes}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              handleNoteSubmit={handleNoteSubmit}
            />
          </div>
        </div>
        
        {/* Right column - Bilateral Stimulation and Transcript */}
        <div className="flex flex-col w-full md:w-1/2 gap-4">
          {/* Bilateral stimulation panel */}
          <div className="h-1/3 bg-white rounded-lg shadow p-4">
            <BilateralStimulation />
          </div>
          
          {/* Transcript panel */}
          <div className="flex-1 bg-white rounded-lg shadow">
            <TranscriptPanel transcriptions={transcriptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSession;