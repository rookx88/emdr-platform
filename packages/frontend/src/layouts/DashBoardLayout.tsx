// packages/frontend/src/layouts/DashBoardLayout.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean; // Add this prop for pages that need full width
  noSidebar?: boolean; // Add this to completely hide the sidebar
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  fullWidth = false,
  noSidebar = false
}) => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Get sidebar collapsed state from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    if (stored) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);
  
  // Update localStorage when sidebar state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  if (!user) {
    return null; // Should be handled by ProtectedRoute
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
      backgroundColor: 'transparent'
    }}>
      {/* Background Image */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/Dashboardbackdrop.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }} 
      />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        {!noSidebar && <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />}
        
        <main style={{
          marginLeft: noSidebar ? '0' : (sidebarCollapsed ? '60px' : '200px'),
          marginTop: '50px',
          padding: noSidebar ? '0' : '20px',
          transition: 'margin-left 0.3s ease',
          flexGrow: 1,
          width: fullWidth || noSidebar ? '100%' : 'auto',
          position: 'relative'
        }}>
          <div className={fullWidth || noSidebar ? 'full-width-content' : 'standard-content'}>
            {children}
          </div>
        </main>
        
        {!noSidebar && <Footer />}
      </div>
    </div>
  );
};

export default DashboardLayout;