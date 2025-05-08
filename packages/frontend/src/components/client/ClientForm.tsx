// packages/frontend/src/components/client/ClientForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ClientFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  therapistId: string;
}

const ClientForm: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<ClientFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    therapistId: ''
  });
  
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableTherapists, setAvailableTherapists] = useState<any[]>([]);
  
  // Load client data if editing
  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchClientData();
    }
    
    // Load available therapists if admin
    if (user?.role === 'ADMIN') {
      fetchTherapists();
    } else if (user?.role === 'THERAPIST') {
      // For therapists, get their own therapist profile ID
      fetchTherapistProfile();
    }
  }, [mode, id, user]);
  
  const fetchClientData = async () => {
    try {
      const response = await api.get(`/clients/${id}`);
      const clientData = response.data;
      
      setFormData({
        email: clientData.user.email || '',
        firstName: clientData.user.firstName || '',
        lastName: clientData.user.lastName || '',
        phoneNumber: clientData.phoneNumber || '',
        dateOfBirth: clientData.dateOfBirth ? new Date(clientData.dateOfBirth).toISOString().split('T')[0] : '',
        address: clientData.address || '',
        emergencyContact: clientData.emergencyContact || '',
        emergencyPhone: clientData.emergencyPhone || '',
        therapistId: clientData.therapist?.id || ''
      });
    } catch (err: any) {
      console.error('Failed to fetch client data:', err);
      setError(err.response?.data?.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTherapists = async () => {
    try {
      const response = await api.get('/therapists');
      setAvailableTherapists(response.data);
    } catch (err: any) {
      console.error('Failed to fetch therapists:', err);
    }
  };
  
  const fetchTherapistProfile = async () => {
    try {
      const response = await api.get('/therapists/me');
      setFormData(prev => ({
        ...prev,
        therapistId: response.data.id
      }));
    } catch (err: any) {
      console.error('Failed to fetch therapist profile:', err);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'create') {
        // Create new client
        await api.post('/clients', formData);
        setSuccess('Client created successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/therapist/clients');
        }, 2000);
      } else {
        // Update existing client
        await api.put(`/clients/${id}`, formData);
        setSuccess('Client updated successfully!');
      }
    } catch (err: any) {
      console.error('Failed to save client:', err);
      setError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading client data...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {mode === 'create' ? 'Add New Client' : 'Edit Client'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-md">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Basic Information */}
          <div className="col-span-1 sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={mode === 'edit'} // Can't change email in edit mode
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="col-span-1 sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          
          {/* Emergency Contact */}
          <div className="col-span-1 sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-4">Emergency Contact</h3>
          </div>
          
          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              id="emergencyPhone"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Therapist Assignment (Admin only) */}
          {user?.role === 'ADMIN' && (
            <>
              <div className="col-span-1 sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 mt-4">Therapist Assignment</h3>
              </div>
              
              <div className="col-span-1 sm:col-span-2">
                <label htmlFor="therapistId" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Therapist
                </label>
                <select
                  id="therapistId"
                  name="therapistId"
                  value={formData.therapistId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select Therapist --</option>
                  {availableTherapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.user.firstName} {therapist.user.lastName} ({therapist.user.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        {/* Form actions */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/therapist/clients')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              saving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : (mode === 'create' ? 'Create Client' : 'Update Client')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;