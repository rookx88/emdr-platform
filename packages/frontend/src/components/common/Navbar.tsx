import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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

      {/* Navigation Links with more spacing */}
      <nav style={{ 
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          marginRight: '1rem'  // More space between nav links and buttons
        }}>
          <Link 
            to="/features"
            style={{
              color: '#4b5563',
              textDecoration: 'none',
              padding: '0.5rem 1rem',  // More horizontal padding
              fontSize: '0.95rem',
              fontWeight: '400'  // Lighter weight for peaceful feel
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
          paddingRight: '3rem'  // Much more space on the right side
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
              padding: '0.5rem 1.25rem',  // Slightly wider button
              borderRadius: '0.375rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              marginLeft: '0.75rem'
            }}
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;