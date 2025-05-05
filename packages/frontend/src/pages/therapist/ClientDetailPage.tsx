// packages/frontend/src/pages/therapist/ClientDetailPage.tsx
import React from 'react';
import ClientDetail from '../../components/client/ClientDetail';

const ClientDetailPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Client Details</h1>
      <ClientDetail />
    </div>
  );
};

export default ClientDetailPage;