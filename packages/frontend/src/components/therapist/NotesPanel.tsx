// packages/frontend/src/components/therapist/NotesPanel.tsx
import React, { useState } from 'react';

interface Note {
  id?: string;
  content: string;
  timestamp: Date;
}

interface NotesPanelProps {
  notes: Note[];
  noteContent: string;
  setNoteContent: (content: string) => void;
  handleNoteSubmit: (e: React.FormEvent) => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  noteContent,
  setNoteContent,
  handleNoteSubmit
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes');
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 font-medium ${
              activeTab === 'notes'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes Editor
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-medium ${
              activeTab === 'history'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Note History
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notes' ? (
          <div className="p-4">
            <form onSubmit={handleNoteSubmit}>
              <div className="mb-4">
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter session notes here..."
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Template
                </button>
                
                <div>
                  <button
                    type="button"
                    className="mr-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </form>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">AI-Assisted Suggestions</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-800 border border-gray-200">
                  <p className="font-medium">Key Observations:</p>
                  <ul className="mt-1 list-disc list-inside text-gray-600">
                    <li>Client showed reduced anxiety when discussing [topic]</li>
                    <li>Progress noted in bilateral processing</li>
                    <li>Consider follow-up on resources discussed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {notes.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No saved notes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-500">
                        {note.timestamp.toLocaleString()}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;