import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';

const ClientSession = () => {
  const { sessionId } = useParams();

  return (
    <ClientLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Séance {sessionId}</h1>
        <p className="text-muted-foreground">Page de séance en cours de développement.</p>
      </div>
    </ClientLayout>
  );
};

export default ClientSession;