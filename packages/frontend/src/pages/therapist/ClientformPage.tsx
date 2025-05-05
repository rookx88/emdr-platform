// packages/frontend/src/pages/therapist/ClientFormPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ClientForm from '../../components/client/ClientForm';

const ClientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'create' ? 'Add New Client' : 'Edit Client'}
      </h1>
      <ClientForm mode={mode} />
    </div>
  );
};

export default ClientFormPage;