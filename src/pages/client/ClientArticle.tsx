import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';

const ClientArticle = () => {
  const { slug } = useParams();

  return (
    <ClientLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Article: {slug}</h1>
        <p className="text-muted-foreground">Page d'article en cours de développement.</p>
      </div>
    </ClientLayout>
  );
};

export default ClientArticle;