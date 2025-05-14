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
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // More transparent
      backdropFilter: 'blur(4px)', // Add blur effect
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)', // Feint border
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' // Subtle shadow
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{
          textDecoration: 'none',
          color: '#f1f5f9', // Off white
          textShadow: '2px 2px 4px rgba(20, 83, 45, 0.5)', // Dark green shadow
          fontFamily: "'Playfair Display', serif", // Elegant font - make sure to import this in your index.html
          fontSize: '35px', // Bigger font size
          fontWeight: '500', // Slightly lighter weight for elegance
          letterSpacing: '1px' // Add slight letter spacing
        }}>
          Mana
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