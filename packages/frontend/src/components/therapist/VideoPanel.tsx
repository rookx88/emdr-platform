// packages/frontend/src/components/therapist/VideoPanel.tsx
import React, { useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext';
import { RemoteParticipant, RemoteTrackPublication } from 'twilio-video';

// Define interfaces to match Twilio's actual track objects
interface TwilioTrack {
  kind: string;
  attach: () => HTMLMediaElement;
  detach: () => HTMLMediaElement[];
}

interface VideoPanelProps {
  isTherapist: boolean;
  isConnecting?: boolean;
  participants?: Map<string, RemoteParticipant>;
  isMainView?: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ 
  isTherapist, 
  isConnecting = false,
  participants,
  isMainView = false
}) => {
  const { localTracks } = useSession();
  const videoRef = useRef<HTMLDivElement>(null);
  
  // For therapist video (local tracks)
  useEffect(() => {
    if (isTherapist && localTracks.length > 0 && videoRef.current) {
      // First clear any existing elements
      while (videoRef.current.firstChild) {
        videoRef.current.removeChild(videoRef.current.firstChild);
      }
      
      // Then attach new tracks
      localTracks.forEach(track => {
        // Cast to TwilioTrack to access the properties we need
        const twilioTrack = track as unknown as TwilioTrack;
        
        // Skip if not a video track
        if (twilioTrack.kind !== 'video') return;
        
        try {
          const element = twilioTrack.attach();
          if (element) {
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.objectFit = 'cover';
            videoRef.current?.appendChild(element);
          }
        } catch (err) {
          console.error('Error attaching local video track:', err);
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      if (videoRef.current) {
        // Clear all child elements
        while (videoRef.current.firstChild) {
          videoRef.current.removeChild(videoRef.current.firstChild);
        }
        
        // Detach tracks (this just detaches from DOM elements, doesn't stop tracks)
        if (isTherapist && localTracks.length > 0) {
          localTracks.forEach(track => {
            try {
              const twilioTrack = track as unknown as TwilioTrack;
              if (twilioTrack.kind === 'video') {
                twilioTrack.detach();
              }
            } catch (err) {
              console.error('Error detaching track:', err);
            }
          });
        }
      }
    };
  }, [isTherapist, localTracks]);
  
  // For client video (remote participants)
  useEffect(() => {
    if (!isTherapist && participants && videoRef.current) {
      // Clear previous content
      while (videoRef.current.firstChild) {
        videoRef.current.removeChild(videoRef.current.firstChild);
      }
      
      // Check if we have any participants
      if (participants.size > 0) {
        // Get the first participant
        const participant = participants.values().next().value;
        
        if (participant) {
          // Attach video tracks from this participant
          participant.videoTracks.forEach((publication: RemoteTrackPublication) => {
            try {
              if (publication.track) {
                const track = publication.track as unknown as TwilioTrack;
                if (track.kind === 'video') {
                  const element = track.attach();
                  element.style.width = '100%';
                  element.style.height = '100%';
                  element.style.objectFit = 'cover';
                  videoRef.current?.appendChild(element);
                }
              }
            } catch (err) {
              console.error('Error attaching remote video track:', err);
            }
          });
          
          // Add track subscription handler for future video tracks
          const handleTrackSubscribed = (track: any) => {
            try {
              const twilioTrack = track as unknown as TwilioTrack;
              if (twilioTrack.kind === 'video' && videoRef.current) {
                const element = twilioTrack.attach();
                element.style.width = '100%';
                element.style.height = '100%';
                element.style.objectFit = 'cover';
                videoRef.current.appendChild(element);
              }
            } catch (err) {
              console.error('Error attaching subscribed video track:', err);
            }
          };
          
          participant.on('trackSubscribed', handleTrackSubscribed);
          
          // Return cleanup function
          return () => {
            participant.off('trackSubscribed', handleTrackSubscribed);
            
            // Detach any attached tracks
            if (videoRef.current) {
              while (videoRef.current.firstChild) {
                videoRef.current.removeChild(videoRef.current.firstChild);
              }
            }
          };
        }
      }
    }
  }, [isTherapist, participants]);
  
  // Different background colors and styling for the video containers
  const getStyles = () => {
    if (isTherapist) {
      return 'h-full w-full bg-gray-700';
    } else if (isMainView) {
      return 'h-full w-full bg-gray-900';
    } else {
      return 'h-full w-full bg-gray-100';
    }
  };
  
  return (
    <div className={`${getStyles()}`} ref={videoRef}>
      {isConnecting && isTherapist && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-sm text-white">Connecting...</p>
          </div>
        </div>
      )}
      
      {!isTherapist && (!participants || participants.size === 0) && (
        <div className="h-full flex items-center justify-center text-white">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-2">Waiting for client...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPanel;