import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

// Simple SVG icons
const ScheduleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12,3 L12,7" />
    <path d="M5,8 C5,8 8,10 12,8 C16,6 19,8 19,8" />
    <path d="M4,12 L20,12" />
    <path d="M4,16 L20,16" />
  </svg>
);

const ClientsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12,5 C12,5 7,8 7,12 C7,16 12,19 12,19 C12,19 17,16 17,12 C17,8 12,5 12,5 Z" />
    <path d="M12,9 C12,9 10,10 10,12 C10,14 12,15 12,15 C12,15 14,14 14,12 C14,10 12,9 12,9 Z" />
  </svg>
);

const MarketingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12,3 L12,6" />
    <path d="M8,5 L16,5" />
    <path d="M4,9 C4,9 8,11 12,9 C16,7 20,9 20,9" />
    <path d="M4,14 C4,14 8,12 12,14 C16,16 20,14 20,14" />
    <path d="M4,19 C4,19 8,17 12,19 C16,21 20,19 20,19" />
  </svg>
);

const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      fontFamily: '"Segoe UI", "Open Sans", "Helvetica Neue", sans-serif',
      letterSpacing: '0.3px'
    }}>
      {/* Background image with inline style to ensure it works */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        
        backgroundImage: "url('/Platformbackdrop.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0
      }} />
      
      {/* Content container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Navbar */}
        <Navbar />
        
        {/* Main content */}
        <main style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem'
        }}>
          {/* Heading and tagline */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3.5rem'
          }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '600',
              marginBottom: '1.25rem',
              color: '#f1f5f9',
              lineHeight: '1.2',
              letterSpacing: '0.5px',
              textShadow: '2px 2px 4px rgba(47, 79, 79, 0.3)'
            }}>
              Grow Your Practice. Lighten Your Load.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#f1f5f9',
              textShadow: '2px 2px 4px rgba(47, 79, 79, 0.5)',
              fontWeight: '400'
            }}>
              Optimized all-purpose toolkit for private practices
            </p>
          </div>
          
          {/* Feature cards */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            justifyContent: 'center',
            gap: '2rem',
            width: '100%',
            maxWidth: '1000px',
            marginBottom: '3.5rem'
          }}>
            {/* Schedule Feature */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              borderRadius: '1rem',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{ 
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <ScheduleIcon />
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '-0.25px -0.25px 0 #000, 0.25px -0.25px 0 #000, -0.25px 0.25px 0 #000, 0.25px 0.25px 0 #000'
              }}>Grow</h2>
              <p style={{
                textAlign: 'center',
                color: '#333',
                fontSize: '1.1rem'
              }}>Tools to build your reach and funneling clients through therapist-feedback provided workflows</p>
            </div>
            
            {/* Marketing Feature */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              borderRadius: '1rem',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{ 
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MarketingIcon />
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '-0.25px -0.25px 0 #000, 0.25px -0.25px 0 #000, -0.25px 0.25px 0 #000, 0.25px 0.25px 0 #000'
              }}>Enhance</h2>
              <p style={{
                textAlign: 'center',
                color: '#333',
                fontSize: '1.1rem'
              }}>Intuitive workflows to simplify and reduce your administrative time and improve your client experience</p>
            </div>
            
            {/* Clients Feature */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              borderRadius: '1rem',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{ 
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <ClientsIcon />
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '-0.25px -0.25px 0 #000, 0.25px -0.25px 0 #000, -0.25px 0.25px 0 #000, 0.25px 0.25px 0 #000'
              }}>Powered by Elura</h2>
              <p style={{
                textAlign: 'center',
                color: '#333',
                fontSize: '1.1rem'
              }}>Intuitive Engine that prioritizes daily workload and runs your practice at the click of a button</p>
            </div>
          </div>
          
          {/* CTA Button */}
          <Link 
            to="/register" 
            style={{
              backgroundColor: '#15803d',
              color: 'white',
              fontSize: '1.2rem',
              padding: '0.875rem 2.5rem',
              borderRadius: '9999px',
              display: 'inline-block',
              textDecoration: 'none',
              fontWeight: '500',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = '#b45309';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = '#d97706';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Get Started
          </Link>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;