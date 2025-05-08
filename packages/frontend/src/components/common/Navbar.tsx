// packages/frontend/src/components/common/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  isLanding?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isLanding = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 100  // Higher than sidebar
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{
          textDecoration: 'none',
          color: '#4338ca', // Indigo color
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          EMDR Therapy Platform
        </Link>
        
        {isLanding && (
          <div style={{ marginLeft: '20px', display: 'flex', gap: '15px' }}>
            <Link to="/features" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>Features</Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>About</Link>
            <Link to="/contact" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>Contact</Link>
            <Link to="/privacy" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>Privacy</Link>
            <Link to="/terms" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>Terms</Link>
          </div>
        )}
      </div>
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            marginRight: '15px', 
            fontSize: '14px',
            color: '#4b5563'
          }}>
            {user.email}
          </span>
          
          <Link to="/dashboard" style={{
            textDecoration: 'none',
            color: '#4b5563',
            fontSize: '14px',
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6',
            marginRight: '10px'
          }}>
            Dashboard
          </Link>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#d97706', // Amber color
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Log out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              backgroundColor: '#4338ca', // Indigo color
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '14px',
              textDecoration: 'none',
              marginRight: '10px'
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Register
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;