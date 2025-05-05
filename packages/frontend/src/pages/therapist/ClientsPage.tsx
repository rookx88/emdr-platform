// packages/frontend/src/pages/therapist/ClientsPage.tsx
import React from 'react';
import ClientList from '../../components/client/ClientList';

const ClientsPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Client Management</h1>
      <ClientList />
    </div>
  );
};

export default ClientsPage;