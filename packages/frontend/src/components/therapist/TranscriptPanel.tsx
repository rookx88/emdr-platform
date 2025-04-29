// packages/frontend/src/components/therapist/TranscriptPanel.tsx
import React, { useEffect, useRef } from 'react';

interface Transcription {
  id?: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

interface TranscriptPanelProps {
  transcriptions: Transcription[];
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcriptions }) => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new transcriptions come in
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptions]);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h3 className="text-lg font-medium text-gray-900">Real-time Transcript</h3>
      </div>
      
      <div
        ref={transcriptRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {transcriptions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No transcript available yet.</p>
            <p className="text-sm mt-2">
              Start recording to begin capturing the conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-gray-800">
                    {item.isUser ? 'You' : 'Client'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <div className={`rounded-lg p-3 ${
                  item.isUser
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t p-4 bg-gray-50">
        <div className="flex">
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Download Transcript
          </button>
          <span className="mx-2 text-gray-300">|</span>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Copy to Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPanel;