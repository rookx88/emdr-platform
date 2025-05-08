// packages/frontend/src/router/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/index';
import DashboardLayout from '../layouts/DashBoardLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  noLayout?: boolean; // Add this prop
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  noLayout = false // Default to false
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute check - user:", user, "loading:", loading);

  if (loading) {
    // You could show a loading screen here
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page with current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User doesn't have the required role
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized
  if (noLayout) {
    return <>{children}</>; // Return children directly without DashboardLayout
  }
  
  // Return with Dashboard Layout if noLayout is false
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default ProtectedRoute;