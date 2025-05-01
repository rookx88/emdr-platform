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
      width: '100%',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'transparent',
      fontFamily: '"Segoe UI", "Open Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Logo - left aligned */}
      <div style={{ 
        paddingLeft: '1.5rem'
      }}>
        <Link to="/" style={{ 
          textDecoration: 'none', 
          color: '#333',
          fontWeight: '500',  // Less bold for a more peaceful look
          fontSize: '1.25rem',
          letterSpacing: '0.5px'  // Slightly spaced letters for a peaceful feel
        }}>
          EMDR Therapy Platform
        </Link>
      </div>

      {/* Navigation Links */}
      <nav style={{ 
        display: 'flex',
        alignItems: 'center'
      }}>
        {user ? (
          // Logged in navigation
          <>
            <div style={{ 
              display: 'flex', 
              marginRight: '1rem'
            }}>
              <Link 
                to="/dashboard" 
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Profile
              </Link>
            </div>

            <div style={{ 
              display: 'flex',
              paddingRight: '3rem'
            }}>
              <button 
                onClick={handleLogout}
                style={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          // Logged out navigation
          <>
            <div style={{ 
              display: 'flex', 
              marginRight: '1rem'
            }}>
              <Link 
                to="/features"
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Features
              </Link>
              <Link 
                to="/pricing"
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Pricing
              </Link>
              <Link 
                to="/resources"
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Resources
              </Link>
              <Link 
                to="/about"
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                About
              </Link>
            </div>

            <div style={{ 
              display: 'flex',
              paddingRight: '3rem'
            }}>
              <Link 
                to="/login" 
                style={{
                  color: '#4b5563',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                style={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  marginLeft: '0.75rem'
                }}
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;