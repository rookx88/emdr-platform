// packages/frontend/src/components/client/ClientList.tsx
import React, { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    fetchClients();
  }, [statusFilter]);
  
  const fetchClients = async () => {
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
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
     
      
      {/* Add New Client Section - Styled like the landing page */}
      <div className="bg-amber-50/80 rounded-xl p-8 mb-8 shadow-md backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Add New Client</h2>
        </div>
        
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            showInviteForm 
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {showInviteForm ? 'Hide Form' : 'Show Form'}
        </button>
        
        {showInviteForm && (
          <div className="mt-6">
            <ClientInviteForm onClientInvited={() => fetchClients()} />
          </div>
        )}
      </div>
      
      {/* Clients Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800">Clients</h2>
        </div>
        
        {/* Search and filter section */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Search clients..."
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
            
            <div className="flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              >
                <option value="all">All Clients</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="p-6 bg-red-50 text-red-700 text-center border-b border-red-100">
            <p>{error}</p>
          </div>
        )}
        
        {/* Client list */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.user.firstName || ''} {client.user.lastName || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{client.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          client.user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        
      </div>
    </div>
  );
};

export default ClientList;