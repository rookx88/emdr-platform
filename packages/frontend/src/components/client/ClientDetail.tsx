// packages/frontend/src/components/client/ClientDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Client {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  therapist?: {
    id: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  };
  phoneNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  appointments: any[];
}

const ClientDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notes'>('overview');
  
  useEffect(() => {
    fetchClientDetails();
  }, [id]);
  
  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/clients/${id}`);
      setClient(response.data);
    } catch (err: any) {
      console.error('Failed to fetch client details:', err);
      setError(err.response?.data?.message || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading client details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600 mb-4">{error}</div>
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/therapist/clients')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-600 mb-4">Client not found</div>
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/therapist/clients')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {client.user.firstName || ''} {client.user.lastName || ''}
          </h2>
          <p className="text-sm text-gray-500">{client.user.email}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/therapist/clients/${client.id}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Edit Client
          </Link>
          <Link
            to={`/therapist/appointments/new?clientId=${client.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Schedule Session
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'appointments'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Date of Birth</div>
                  <div className="text-sm text-gray-900">{formatDate(client.dateOfBirth)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Phone Number</div>
                  <div className="text-sm text-gray-900">{client.phoneNumber || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div className="text-sm text-gray-900">{client.address || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Client Since</div>
                  <div className="text-sm text-gray-900">{formatDate(client.user.createdAt)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Last Login</div>
                  <div className="text-sm text-gray-900">{formatDate(client.user.lastLoginAt)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Name</div>
                  <div className="text-sm text-gray-900">{client.emergencyContact || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Phone</div>
                  <div className="text-sm text-gray-900">{client.emergencyPhone || 'N/A'}</div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Upcoming Sessions</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {client.appointments && client.appointments.length > 0 ? (
                  <div className="space-y-3">
                    {client.appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex justify-between">
                        <div>
                          <div className="text-sm font-medium">{appointment.title}</div>
                          <div className="text-xs text-gray-500">{formatDate(appointment.startTime)}</div>
                        </div>
                        <Link
                          to={`/therapist/appointments/${appointment.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">No upcoming sessions</div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Appointments History</h3>
              <Link
                to={`/therapist/appointments/new?clientId=${client.id}`}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                Schedule New
              </Link>
            </div>
            
            {client.appointments && client.appointments.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul>
                  {client.appointments.map((appointment) => (
                    <li key={appointment.id} className="border-b border-gray-200 last:border-b-0">
                      <Link
                        to={`/therapist/appointments/${appointment.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-indigo-600 truncate">
                              {appointment.title || appointment.type}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {new Date(appointment.startTime).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'CANCELED' 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No appointments found</p>
                <Link
                  to={`/therapist/appointments/new?clientId=${client.id}`}
                  className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Schedule First Appointment
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Client Notes</h3>
              <button
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                Add Note
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <textarea
                className="w-full h-32 p-2 border border-gray-300 rounded resize-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a new note..."
              ></textarea>
              <div className="flex justify-end mt-2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Save Note
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="font-medium">Initial Assessment</div>
                  <div className="text-xs text-gray-500">April 24, 2025</div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Client reported experiencing anxiety and sleep disturbances related to past trauma. 
                  Initial assessment indicates EMDR therapy may be beneficial.
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="font-medium">Session Follow-up</div>
                  <div className="text-xs text-gray-500">April 27, 2025</div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Client responded well to initial EMDR session. Reported reduced anxiety symptoms 
                  and improved sleep quality. Will continue with bilateral stimulation exercises.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;