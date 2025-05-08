// packages/frontend/src/components/client/ClientInviteForm.tsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ClientInviteFormProps {
  onClientInvited: () => void;
}

const ClientInviteForm: React.FC<ClientInviteFormProps> = ({ onClientInvited }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleSession, setScheduleSession] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    sessionDate: '',
    sessionTime: '',
    sessionType: 'INTAKE',
    notes: '',
    sendWelcomeEmail: true
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First create client
      const clientData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        // Therapist ID will be handled by the backend if the user is a therapist
      };
      
      const response = await api.post('/clients/invite', {
        ...clientData,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        // Include session data if scheduling a session
        session: scheduleSession ? {
          date: formData.sessionDate,
          time: formData.sessionTime,
          type: formData.sessionType,
          notes: formData.notes
        } : null
      });
      
      setSuccess(`Client invitation sent to ${formData.email} successfully!`);
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        sessionDate: '',
        sessionTime: '',
        sessionType: 'INTAKE',
        notes: '',
        sendWelcomeEmail: true
      });
      
      // Refresh client list
      onClientInvited();
      
    } catch (err: any) {
      console.error('Failed to invite client:', err);
      setError(err.response?.data?.message || 'Failed to invite client');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-4 p-5 bg-white border border-amber-100 rounded-lg shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Information */}
          <div className="md:col-span-2">
            <h3 className="text-md font-medium text-amber-800 mb-2">Client Information</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="client@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              An invitation link will be sent to this address
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="(555) 123-4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          {/* Session Scheduling Toggle */}
          <div className="md:col-span-2 mt-2">
            <div className="flex items-center">
              <input
                id="scheduleSession"
                name="scheduleSession"
                type="checkbox"
                checked={scheduleSession}
                onChange={() => setScheduleSession(!scheduleSession)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <label htmlFor="scheduleSession" className="ml-2 block text-sm text-amber-800 font-medium">
                Schedule initial session
              </label>
            </div>
          </div>
          
          {/* Session Details - Only shown if scheduleSession is true */}
          {scheduleSession && (
            <>
              <div className="md:col-span-2 mt-2">
                <h3 className="text-md font-medium text-amber-800 mb-2">Initial Session Details</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="sessionDate"
                  required={scheduleSession}
                  value={formData.sessionDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
                  min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="sessionTime"
                  required={scheduleSession}
                  value={formData.sessionTime}
                  onChange={handleChange}
                  className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="INTAKE">Initial Intake</option>
                  <option value="EMDR">EMDR Session</option>
                  <option value="STANDARD">Standard Session</option>
                  <option value="FOLLOWUP">Follow-up Session</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Initial session notes or preparation instructions..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
                ></textarea>
              </div>
            </>
          )}
          
          {/* Email options */}
          <div className="md:col-span-2">
            <div className="flex items-center mt-2">
              <input
                id="sendWelcomeEmail"
                name="sendWelcomeEmail"
                type="checkbox"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData({...formData, sendWelcomeEmail: e.target.checked})}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-700">
                Send welcome email with invitation link
              </label>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Invitation...' : 'Send Client Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientInviteForm;