import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Footer links
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Terms', path: '/terms' }
  ];

  return (
    <footer style={{
      width: '100%',
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      color: '#4b5563',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Links row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1.5rem',
        marginBottom: '0.5rem'
      }}>
        {links.map((link) => (
          <Link 
            key={link.name}
            to={link.path}
            style={{
              color: '#4b5563',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#1f2937'}
            onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#4b5563'}
          >
            {link.name}
          </Link>
        ))}
      </div>
      
      {/* Copyright line */}
      <div style={{
        fontSize: '0.75rem'
      }}>
        © {currentYear} EMDR Therapy Platform. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;