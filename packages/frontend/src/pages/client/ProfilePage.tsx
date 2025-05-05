// packages/frontend/src/pages/client/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchClientProfile();
  }, []);
  
  const fetchClientProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the 'me' endpoint that returns the current client's profile
      const response = await api.get('/clients/me');
      setProfile(response.data);
    } catch (err: any) {
      console.error('Failed to fetch client profile:', err);
      setError(err.response?.data?.message || 'Failed to load your profile information');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p>{error}</p>
          <button 
            onClick={fetchClientProfile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 text-yellow-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p>We couldn't find your profile information. Please contact your therapist or support.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      {/* Personal Information Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1 text-gray-900">
                {profile.user.firstName || ''} {profile.user.lastName || ''}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-gray-900">{profile.user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
              <p className="mt-1 text-gray-900">{formatDate(profile.dateOfBirth)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
              <p className="mt-1 text-gray-900">{profile.phoneNumber || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-900">{profile.address || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="mt-6 flex">
            <Link
              to="/client/profile/edit"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Information
            </Link>
          </div>
        </div>
      </div>
      
      {/* Therapist Information Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Therapist</h2>
        </div>
        <div className="p-6">
          {profile.therapist ? (
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl text-indigo-500 mr-6">
                {profile.therapist.user.firstName?.charAt(0) || ''}
                {profile.therapist.user.lastName?.charAt(0) || ''}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {profile.therapist.user.firstName || ''} {profile.therapist.user.lastName || ''}
                </h3>
                <p className="text-sm text-gray-500">EMDR Therapist</p>
                <div className="mt-2">
                  <a 
                    href={`mailto:${profile.therapist.user.email}`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Contact Therapist
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No therapist has been assigned to you yet.</p>
              <p className="text-sm text-gray-400 mt-2">Please contact support for assistance.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Upcoming Appointments Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          <Link
            to="/client/appointments"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {profile.appointments && profile.appointments.length > 0 ? (
            profile.appointments.map((appointment: any) => (
              <div key={appointment.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {appointment.title || appointment.type}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(appointment.startTime).toLocaleDateString()}, {" "}
                      {new Date(appointment.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {" "}
                      {new Date(appointment.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="mt-4 flex space-x-3">
                  {appointment.status !== 'CANCELED' && (
                    <Link
                      to={`/client/session/${appointment.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Join Session
                    </Link>
                  )}
                  <Link
                    to={`/client/appointments/${appointment.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-500 mb-3">You don't have any upcoming appointments</p>
              <Link
                to="/client/appointments?booking=true"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Book an Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Emergency Contact Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Emergency Contact</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Name</h3>
              <p className="mt-1 text-gray-900">{profile.emergencyContact || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Phone</h3>
              <p className="mt-1 text-gray-900">{profile.emergencyPhone || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-md p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    If you're experiencing a medical emergency, please call 911 or go to your nearest emergency room.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;