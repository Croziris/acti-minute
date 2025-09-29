import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';

const ClientArticles = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <p className="text-muted-foreground">Page des articles en cours de développement.</p>
      </div>
    </ClientLayout>
  );
};

export default ClientArticles;