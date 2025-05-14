import React, { useEffect, useRef } from 'react';

interface VideoProps {
  token?: string;
  roomName?: string;
  onError?: (error: Error) => void;
}

/**
 * A placeholder component that simulates a Twilio Video connection
 * To be replaced with actual Twilio Video integration in production
 */
const TwilioVideo: React.FC<VideoProps> = ({ token, roomName, onError }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Simulate connecting to a Twilio room
  useEffect(() => {
    if (!token || !roomName) return;
    
    console.log(`Connecting to Twilio room: ${roomName} with token`);
    
    // Simulate getting local video
  const getLocalVideo = async () => {
    try {
      // This would normally use navigator.mediaDevices.getUserMedia
      // For the mockup, we'll just use a timeout to simulate the process
      setTimeout(() => {
        console.log('Local video stream acquired');
        if (localVideoRef.current) {
          // In a real implementation, this would set the srcObject of the video element
          localVideoRef.current.classList.add('active');
        }
      }, 1000);
    } catch (err: unknown) {
      console.error('Error getting local video:', err);
      if (onError && err instanceof Error) onError(err);
    }
  };
    
    // Simulate connecting to a remote participant
    const connectToRoom = async () => {
      try {
        // This would normally use the Twilio Video JS SDK
        // For the mockup, we'll just use a timeout to simulate the process
        setTimeout(() => {
          console.log('Connected to remote participant');
          if (remoteVideoRef.current) {
            // In a real implementation, this would set the srcObject of the video element
            remoteVideoRef.current.classList.add('active');
          }
        }, 2000);
      } catch (err: unknown) {
        console.error('Error connecting to room:', err);
        if (onError && err instanceof Error) onError(err);
      }
    };
    
    getLocalVideo();
    connectToRoom();
    
    // Cleanup function
    return () => {
      console.log('Disconnecting from Twilio room');
      // In a real implementation, this would disconnect from the room
      if (localVideoRef.current) {
        localVideoRef.current.classList.remove('active');
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.classList.remove('active');
      }
    };
  }, [token, roomName, onError]);
  
  return (
    <div className="relative w-full h-full">
      {/* Remote video - this would show the client */}
      <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {token ? (
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
            autoPlay
            playsInline
            muted={false}
          />
        ) : (
          <div className="text-white">Waiting for connection...</div>
        )}
        
        {/* Show "Twilio videocam of user" text as a placeholder */}
        {token && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xl pointer-events-none">
            Twilio videocam of user
          </div>
        )}
      </div>
      
      {/* Local video - this would show the therapist */}
      <div className="absolute bottom-5 right-5 w-1/4 h-1/4 bg-gray-800 rounded shadow-lg overflow-hidden">
        {token ? (
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xs">
            Loading...
          </div>
        )}
        
        {/* Show "Self view of therapist" text as a placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs pointer-events-none">
          Self view of therapist
        </div>
      </div>
      
      {/* Video controls (mute, camera toggle, etc.) */}
      {token && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-60 rounded-full px-4 py-2 flex space-x-4">
          <button className="text-white hover:text-gray-300 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button className="text-white hover:text-gray-300 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="text-white hover:text-red-500 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TwilioVideo;

// Add some CSS to make the videos appear when they're "active"
document.head.insertAdjacentHTML('beforeend', `
  <style>
    video.active {
      opacity: 1 !important;
    }
  </style>
`);