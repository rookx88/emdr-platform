// packages/frontend/src/components/common/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
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
      </div>
      
      {user && (
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
      )}
    </header>
  );
};

export default Navbar;