import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';

const ClientHabits = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mes Habitudes</h1>
        <p className="text-muted-foreground">Page des habitudes en cours de développement.</p>
      </div>
    </ClientLayout>
  );
};

export default ClientHabits;