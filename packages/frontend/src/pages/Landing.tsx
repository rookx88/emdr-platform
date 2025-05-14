import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';



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
            marginBottom: '3rem'
          }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '600',
              marginBottom: '.5rem',
              color: '#f1f5f9',
              lineHeight: '1.2',
              letterSpacing: '0.5px',
              textShadow: '2px 2px 4px rgba(47, 79, 79, 0.3)'
            }}>
              One Place. One Price.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#f1f5f9',
              textShadow: '2px 2px 4px rgba(47, 79, 79, 0.5)',
              fontWeight: '400'
            }}>
              All you need to run your private practice.
            </p>
          </div>
          
          {/* Feature cards container */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            justifyContent: 'center',
            gap: '2rem',
            width: '100%',
            maxWidth: '1000px',
            marginBottom: '3.5rem'
          }}>
            {/* First card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              maxHeight: '160px',
              width: '300px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>Intuitive</h2>
              <p style={{
                textAlign: 'center',
                color: '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: '1.2',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>Manages and executes your daily workflow tasks at the click of a button so you can spend more time on what matters</p>
            </div>

            {/* Second card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              maxHeight: '160px',
              width: '300px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>Enhance</h2>
              <p style={{
                textAlign: 'center',
                color: '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: '1.2',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>Intuitive workflows to simplify and reduce your administrative time and improve your client experience</p>
            </div>

            {/* Third card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              maxHeight: '160px',
              width: '300px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#f1f5f9',
                textAlign: 'center',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>All in One</h2>
              <p style={{
                textAlign: 'center',
                color: '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: '1.2',
                textShadow: '0 0 3px rgba(0, 0, 0, 0.5)'
              }}>Everything you need to run your private business from billing, to scheduling, to client management</p>
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