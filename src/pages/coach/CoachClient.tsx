import React from 'react';
import { useParams } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';

const CoachClient = () => {
  const { id } = useParams();

  return (
    <CoachLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Client {id}</h1>
        <p className="text-muted-foreground">Page client coach en cours de développement.</p>
      </div>
    </CoachLayout>
  );
};

export default CoachClient;