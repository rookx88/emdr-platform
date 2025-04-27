// src/components/common/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            EMDR Therapy Platform
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">
                Welcome, {user.firstName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-white text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white hover:text-gray-200 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;