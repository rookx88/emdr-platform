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
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Therapist Notes</h2>
        <div className="flex mt-2">
          <button
            onClick={() => setShowHistory(false)}
            className={`mr-2 px-3 py-1 rounded ${
              !showHistory ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-3 py-1 rounded ${
              showHistory ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            History
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {!showHistory ? (
          <form onSubmit={handleNoteSubmit}>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your session notes here..."
            ></textarea>
            
            <div className="mt-4 flex justify-between">
              <div>
                <button
                  type="button"
                  className="px-3 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Insert Template
                </button>
                <button
                  type="button" 
                  onClick={() => setNoteContent('')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Note
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No saved notes yet</p>
              </div>
            ) : (
              notes.map((note, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      {note.timestamp.toLocaleString()}
                    </span>
                    <div>
                      <button className="text-indigo-600 text-sm mr-2">Edit</button>
                      <button className="text-gray-500 text-sm">Delete</button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800">
                    {note.content}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;