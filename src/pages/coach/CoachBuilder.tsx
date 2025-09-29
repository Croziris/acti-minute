import React from 'react';
import { useParams } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';

const CoachBuilder = () => {
  const { clientId } = useParams();

  return (
    <CoachLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Builder pour client {clientId}</h1>
        <p className="text-muted-foreground">Page builder coach en cours de développement.</p>
      </div>
    </CoachLayout>
  );
};

export default CoachBuilder;