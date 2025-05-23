// packages/frontend/src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from '../types/index';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

import Landing from '../pages/Landing';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboard pages
import TherapistDashboard from '../pages/therapist/Dashboard';
import ClientDashboard from '../pages/client/Dashboard';

// Session pages
import SessionPage from '../pages/therapist/SessionPage'; // Import the new SessionPage

// Appointment pages

import ClientAppointmentsPage from '../pages/client/AppointmentsPage';

// Other pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

import ErrorBoundary from '../components/common/ErrorBoundary';

// Calendar pages
import { CalendarProvider } from '../context/CalendarContext';
import CalendarPage from '../pages/therapist/CalendarPage';
import ClientsPage from '../pages/therapist/ClientsPage';
import ClientProfilePage from '../pages/client/ProfilePage';
import ClientFormPage from '../pages/therapist/ClientformPage';
import ClientDetailPage from '../pages/therapist/ClientDetailPage';
import DashboardLayout from '../layouts/DashBoardLayout';
import AcceptInvitation from '../pages/auth/AcceptInvitation';
const AppRouter: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <CalendarProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/accept-invite/:token"
                element={<AcceptInvitation />}
              />

              {/* Protected routes */}
              <Route
                path="/therapist"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>

                    <TherapistDashboard />

                  </ProtectedRoute>
                }
              />

              {/* New route for therapy sessions */}
              <Route
                path="/therapist/session/:sessionId"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]} noLayout={true}>
                    <SessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/therapist/calendar"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/therapist/clients"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/profile"
                element={
                  <ProtectedRoute allowedRoles={[Role.CLIENT]}>
                    <ClientProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/therapist/clients/new"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>
                    <ClientFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/therapist/clients/:id"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>
                    <ClientDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/therapist/clients/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[Role.THERAPIST, Role.ADMIN]}>
                    <ClientFormPage />
                  </ProtectedRoute>
                }
              />


              <Route
                path="/client/appointments"
                element={
                  <ProtectedRoute allowedRoles={[Role.CLIENT]}>
                    <ClientAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/client"
                element={
                  <ProtectedRoute allowedRoles={[Role.CLIENT]}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />


              {/* The RoleBasedRedirect will only be used after login */}
              <Route
                path="/dashboard"
                element={<RoleBasedRedirect />}
              />

              {/* 404 Path */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CalendarProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
};

// Helper component to redirect based on user role
const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case Role.ADMIN:
    case Role.THERAPIST:
      return <Navigate to="/therapist" replace />;
    case Role.CLIENT:
      return <Navigate to="/client" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default AppRouter;