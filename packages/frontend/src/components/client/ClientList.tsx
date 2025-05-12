// packages/frontend/src/components/client/ClientList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ClientInviteForm from './ClientInviteForm';

interface Client {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    isActive: boolean;
  };
  therapist?: {
    id: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Use useCallback to memoize the fetchClients function
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.get('/clients', { params });
      setClients(response.data);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]); // Added dependencies
  
  // Use fetchClients in useEffect with proper dependencies
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Add New Client button on the right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-6 py-3 bg-amber-100 text-gray-800 hover:bg-amber-200 rounded-full font-medium"
        >
          {showInviteForm ? 'Hide Form' : 'Add New Client'}
        </button>
      </div>
      
      {/* Client invite form (collapsible) */}
      {showInviteForm && (
        <div className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Add New Client</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new client account and optionally send them an invitation email
            </p>
          </div>
          <div className="p-6">
            <ClientInviteForm 
              onClientInvited={() => {
                fetchClients();
                setShowInviteForm(false); // Auto-hide form after successful invitation
              }} 
            />
          </div>
        </div>
      )}
      
      {/* Search and filter bar */}
      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-grow relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full"
            placeholder="Search clients..."
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-full bg-white"
        >
          <option value="all">All Clients</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      
      {/* Client list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500">NAME</div>
          <div className="text-sm font-medium text-gray-500">EMAIL</div>
          <div className="text-sm font-medium text-gray-500">STATUS</div>
          <div className="text-sm font-medium text-gray-500 text-right">ACTIONS</div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="px-6 py-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading clients...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="px-6 py-4 text-red-700 bg-red-50">
            <p>{error}</p>
          </div>
        )}
        
        {/* Empty state */}
        {!loading && !error && clients.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-500">No clients found</p>
          </div>
        )}
        
        {/* Client rows */}
        {!loading && !error && clients.map((client) => (
          <div 
            key={client.id} 
            className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-gray-50"
          >
            <div className="font-medium text-gray-900">
              {client.user.firstName || ''} {client.user.lastName || ''}
            </div>
            <div className="text-gray-500">{client.user.email}</div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                client.user.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {client.user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-right">
              <Link 
                to={`/therapist/clients/${client.id}`}
                className="text-amber-600 hover:text-amber-800 mr-4"
              >
                View
              </Link>
              <Link 
                to={`/therapist/clients/${client.id}/edit`}
                className="text-amber-600 hover:text-amber-800"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;