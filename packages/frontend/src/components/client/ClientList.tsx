// packages/frontend/src/components/client/ClientList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Clients</h2>
      </div>
      
      {/* Search and filter section */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-grow">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search clients..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </form>
          
          <div className="flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Clients</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          
          <div className="flex-shrink-0">
            <Link
              to="/therapist/clients/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Client
            </Link>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading clients...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 text-center">
          {error}
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/therapist/clients/${client.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;