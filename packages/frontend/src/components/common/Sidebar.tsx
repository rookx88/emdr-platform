// packages/frontend/src/components/common/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/index';

// Define the prop types interface
interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed: externalCollapsed,
  onToggle
}) => {
  const { user } = useAuth();
  const location = useLocation();
  // Use internal state if no external state is provided
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Determine which collapsed state to use
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  if (!user) return null;
  
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  const icons = {
    dashboard: '🏠',
    clients: '👥',
    sessions: '📅',
    tools: '🧰',
    profile: '👤',
    appointments: '📆',
    calendar: '📅',
    resources: '📚'
  };

  // Handle toggle
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!collapsed);
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Define role-specific navigation items
  const getNavigationItems = () => {
    // User is a therapist
    if (user.role === Role.THERAPIST || user.role === Role.ADMIN) {
      return (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.dashboard}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Dashboard</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist/clients" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.clients}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Clients</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist/sessions" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.sessions}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Sessions</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist/tools" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.tools}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>EMDR Tools</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist/profile" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.profile}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Profile</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/therapist/calendar" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.calendar}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Calendar</span>}
            </Link>
          </li>
        </ul>
      );
    }
    // User is a client
    else if (user.role === Role.CLIENT) {
      return (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/client" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.dashboard}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Dashboard</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/client/appointments" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.appointments}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Appointments</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/client/resources" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.resources}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Resources</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/client/tools" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.tools}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Self-Help Tools</span>}
            </Link>
          </li>
          <li style={{ marginBottom: '5px' }}>
            <Link to="/client/profile" style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              textDecoration: 'none',
              padding: collapsed ? '10px 5px' : '10px',
              borderRadius: '4px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>{icons.profile}</span>
              {!collapsed && <span style={{ marginLeft: '10px' }}>Profile</span>}
            </Link>
          </li>
        </ul>
      );
    }
    // Default empty navigation if role doesn't match
    return <ul></ul>;
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: collapsed ? '60px' : '200px',
      backgroundColor: '#93A5CF', // Dark lavender
      color: 'white',
      zIndex: 50, // Below navbar
      paddingTop: '60px', // Space for header
      transition: 'width 0.3s ease',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* User profile section */}
      {!collapsed && (
        <div style={{
          marginBottom: '10px',
          padding: '5px 10px',
          textAlign: 'center'
        }}>
          <div>{user.email}</div>
          <div style={{ fontWeight: 'bold' }}>{user.role}</div>
        </div>
      )}

      {/* Navigation links - role-based */}
      <div style={{
        flex: '1 0 auto',
        padding: collapsed ? '5px' : '10px'
      }}>
        {getNavigationItems()}
      </div>
      
      {/* Toggle button moved below the navigation links */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
        marginBottom: '10px',
        padding: '5px'
      }}>
        <button
          onClick={handleToggle}
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            borderRadius: '50%',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        >
          {collapsed ? '❯' : '❮'}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '10px 5px' : '10px',
        textAlign: 'center',
        fontSize: collapsed ? '10px' : '12px',
        borderTop: '1px solid #374151',
        marginTop: 'auto'
      }}>
        <div>HIPAA</div>
        <div>Compliant</div>
        <div>© 2025</div>
      </div>
    </div>
  );
};

export default Sidebar;