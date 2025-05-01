// Create a new file: packages/frontend/src/layouts/SessionLayout.tsx
import React from 'react';

interface SessionLayoutProps {
  children: React.ReactNode;
}

const SessionLayout: React.FC<SessionLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
};

export default SessionLayout;