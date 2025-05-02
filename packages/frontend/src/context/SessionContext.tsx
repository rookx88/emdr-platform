// packages/frontend/src/context/SessionContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { connect, Room, LocalTrack, LocalAudioTrack, LocalVideoTrack, RemoteParticipant, RemoteTrack } from 'twilio-video';
import { useAuth } from './AuthContext';

interface Transcription {
  id?: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

interface Note {
  id?: string;
  content: string;
  timestamp: Date;
}

interface SessionContextType {
  sessionId: string | null;
  room: Room | null;
  localTracks: LocalTrack[];
  participants: Map<string, RemoteParticipant>;
  isConnecting: boolean;
  isRecording: boolean;
  transcriptions: Transcription[];
  notes: Note[];
  bilateralSpeed: number;
  bilateralDirection: 'horizontal' | 'vertical';
  bilateralActive: boolean;
  
  // Methods
  startSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  transcribeAudio: (audioChunk: Blob) => Promise<void>;
  saveNote: (content: string) => Promise<void>;
  setBilateralSpeed: (speed: number) => void;
  setBilateralDirection: (direction: 'horizontal' | 'vertical') => void;
  toggleBilateralStimulation: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  // State for recording and transcription
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // State for bilateral stimulation
  const [bilateralSpeed, setBilateralSpeed] = useState<number>(1);
  const [bilateralDirection, setBilateralDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [bilateralActive, setBilateralActive] = useState<boolean>(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionStartedRef = useRef<boolean>(false);
  
  const { user } = useAuth();
  
  // Function to handle adding participants
  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log(`Participant ${participant.identity} connected`);
    
    setParticipants(prevParticipants => {
      const newParticipants = new Map(prevParticipants);
      newParticipants.set(participant.identity, participant);
      return newParticipants;
    });
    
    // Handle participant tracks
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        handleTrackSubscribed(participant, publication.track as RemoteTrack);
      }
    });
    
    participant.on('trackSubscribed', track => {
      handleTrackSubscribed(participant, track);
    });
    
    participant.on('trackUnsubscribed', track => {
      handleTrackUnsubscribed(track);
    });
  }, []);
  
  // Function to handle participant disconnection
  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    console.log(`Participant ${participant.identity} disconnected`);
    
    setParticipants(prevParticipants => {
      const newParticipants = new Map(prevParticipants);
      newParticipants.delete(participant.identity);
      return newParticipants;
    });
  }, []);
  
  // Function to handle track subscription
  const handleTrackSubscribed = (participant: RemoteParticipant, track: RemoteTrack) => {
    console.log(`Track subscribed: ${track.kind}`);
    
    if (track.kind === 'audio' || track.kind === 'video') {
      // Type cast to access the attach method which may not be in the type definition
      const mediaTrack = track as unknown as { attach: () => HTMLMediaElement };
      const mediaElement = mediaTrack.attach();
      const participantDiv = document.getElementById(`participant-${participant.identity}`);
      if (participantDiv) {
        participantDiv.appendChild(mediaElement);
      }
    }
  };
  
  // Function to handle track unsubscription
  const handleTrackUnsubscribed = (track: RemoteTrack) => {
    console.log(`Track unsubscribed: ${track.kind}`);
    
    if (track.kind === 'audio' || track.kind === 'video') {
      // Type cast to access the detach method which may not be in the type definition
      const mediaTrack = track as unknown as { detach: () => HTMLMediaElement[] };
      if (typeof mediaTrack.detach === 'function') {
        const elements = mediaTrack.detach();
        elements.forEach((element: HTMLMediaElement) => element.remove());
      }
    }
  };
  
  // Load notes for a session
  const loadNotes = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/notes/${sessionId}`);
      const data = await response.json();
      
      if (data && data.notes) {
        setNotes(data.notes.map((note: any) => ({
          id: note.id,
          content: note.content,
          timestamp: new Date(note.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, []);
  
  // Function to get Twilio token and connect to room
  const startSession = useCallback(async (sessionIdParam: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    // Prevent duplicate initialization
    if (sessionStartedRef.current || room) {
      console.log('Session already initialized, reusing existing room');
      return;
    }
    
    sessionStartedRef.current = true;
    
    try {
      setIsConnecting(true);
      setSessionId(sessionIdParam);
      
      // Get token from backend
      const tokenResponse = await fetch('/api/sessions/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionIdParam })
      });
      
      const tokenData = await tokenResponse.json();
      const { token, roomName } = tokenData;
      
      // Create room
      await fetch('/api/sessions/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionIdParam })
      });
      
      // Connect to the room
      console.log('Connecting to Twilio room:', roomName);
      const twilioRoom = await connect(token, {
        name: roomName,
        audio: true,
        video: true,
        dominantSpeaker: true
      });
      
      console.log('Connected to room:', twilioRoom.name);
      setRoom(twilioRoom);
      
      // Save local audio and video tracks
      const tracks = Array.from(twilioRoom.localParticipant.tracks.values())
        .map(publication => publication.track)
        .filter(track => track !== null) as LocalTrack[];
      
      setLocalTracks(tracks);
      
      // Set up event listeners for participants
      twilioRoom.participants.forEach(handleParticipantConnected);
      twilioRoom.on('participantConnected', handleParticipantConnected);
      twilioRoom.on('participantDisconnected', handleParticipantDisconnected);
      
      // Load existing notes if any
      await loadNotes(sessionIdParam);
      
      setIsConnecting(false);
    } catch (error) {
      console.error('Error connecting to session:', error);
      sessionStartedRef.current = false;
      setIsConnecting(false);
      throw error;
    }
  }, [user, handleParticipantConnected, handleParticipantDisconnected, loadNotes]);
  
  // Function to stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  }, []);
  
  // Function to end session
  const endSession = useCallback(async () => {
    // Prevent multiple calls to end the same session
    if (!room || !sessionStartedRef.current) {
      console.log('No active room to end');
      return;
    }
    
    const roomToEnd = room;
    const currentSessionId = sessionId;
    
    // Reset state before async operations to prevent race conditions
    setRoom(null);
    sessionStartedRef.current = false;
    
    if (isRecording) {
      stopRecording();
    }
    
    // Disconnect and clean up
    try {
      // Clean up local tracks
      roomToEnd.localParticipant.tracks.forEach(publication => {
        const track = publication.track;
        if (track) {
          // Type guard to check if it's an audio or video track with stop method
          if (track.kind === 'audio' || track.kind === 'video') {
            // Cast to appropriate type to access stop method
            const mediaTrack = track as (LocalAudioTrack | LocalVideoTrack);
            mediaTrack.stop();
          }
          
          // Detach any media elements
          if (track.kind === 'audio' || track.kind === 'video') {
            // Type cast to access the detach method
            const mediaTrack = track as (LocalAudioTrack | LocalVideoTrack);
            try {
              const attachments = mediaTrack.detach();
              attachments.forEach((attachment: HTMLMediaElement) => {
                try {
                  attachment.remove();
                } catch (e) {
                  console.warn('Error removing media element:', e);
                }
              });
            } catch (e) {
              console.warn('Error detaching media track:', e);
            }
          }
        }
      });
      
      // End room on server
      if (currentSessionId) {
        try {
          await fetch('/api/sessions/room/end', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roomSid: roomToEnd.sid,
              sessionId: currentSessionId
            })
          });
        } catch (error) {
          console.warn('Error ending room on server, continuing cleanup:', error);
        }
      }
      
      // Disconnect from the room
      try {
        roomToEnd.disconnect();
      } catch (e) {
        console.warn('Error disconnecting from room:', e);
      }
      
      // Reset all state
      setLocalTracks([]);
      setParticipants(new Map());
      setSessionId(null);
      setTranscriptions([]);
      setBilateralActive(false);
      
      console.log('Session ended and cleaned up');
    } catch (error) {
      console.error('Error during session cleanup:', error);
      throw error;
    }
  }, [room, isRecording, sessionId, stopRecording]);
  
  // Function to start recording
  const startRecording = useCallback(() => {
    if (!room || !room.localParticipant) return;
    
    // Get local audio track
    const audioTrack = Array.from(room.localParticipant.audioTracks.values())
      .map(publication => publication.track)[0];
    
    if (!audioTrack) {
      console.error('No local audio track found');
      return;
    }
    
    try {
      // Get audio stream from track
      const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up media recorder events
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          // Combine audio chunks and transcribe
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await transcribeAudio(audioBlob);
          audioChunksRef.current = [];
        }
      };
      
      // Start recording with 5 second intervals
      mediaRecorder.start(5000);
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [room]);
  
  // Function to transcribe audio
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!sessionId) return;
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove the data:audio/webm;base64, part
        const base64Audio = base64data.split(',')[1];
        
        // Send to server for transcription
        const response = await fetch('/api/sessions/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioContent: base64Audio,
            sessionId
          })
        });
        
        const data = await response.json();
        
        if (data && data.transcription) {
          const transcription = data.transcription.trim();
          if (transcription) {
            setTranscriptions(prev => [
              ...prev,
              {
                text: transcription,
                timestamp: new Date(),
                isUser: true
              }
            ]);
          }
        }
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  }, [sessionId]);
  
  // Function to save note
  const saveNote = useCallback(async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    try {
      const response = await fetch('/api/sessions/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          sessionId
        })
      });
      
      const data = await response.json();
      
      if (data && data.note) {
        setNotes(prev => [
          ...prev,
          {
            id: data.note.id,
            content,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [sessionId]);
  
  // Function to toggle bilateral stimulation
  const toggleBilateralStimulation = useCallback(() => {
    setBilateralActive(prev => !prev);
  }, []);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Only attempt cleanup if we have an active session
      if (sessionStartedRef.current && room) {
        console.log('Cleaning up session on unmount');
        
        // Stop recording if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        
        // Clean up tracks without waiting for async operations
        if (room && room.localParticipant) {
          room.localParticipant.tracks.forEach(publication => {
            const track = publication.track;
            if (track && (track.kind === 'audio' || track.kind === 'video')) {
              try {
                (track as any).stop();
                const attachments = (track as any).detach();
                if (attachments) {
                  attachments.forEach((element: HTMLElement) => element.remove());
                }
              } catch (e) {
                console.warn('Error cleaning up track:', e);
              }
            }
          });
        }
        
        try {
          room.disconnect();
        } catch (e) {
          console.warn('Error disconnecting from room during cleanup:', e);
        }
        
        sessionStartedRef.current = false;
      }
    };
  }, [room]);
  
  const value = {
    sessionId,
    room,
    localTracks,
    participants,
    isConnecting,
    isRecording,
    transcriptions,
    notes,
    bilateralSpeed,
    bilateralDirection,
    bilateralActive,
    startSession,
    endSession,
    startRecording,
    stopRecording,
    transcribeAudio,
    saveNote,
    setBilateralSpeed,
    setBilateralDirection,
    toggleBilateralStimulation
  };
  
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
