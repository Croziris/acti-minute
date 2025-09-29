import React from 'react';
import { CoachLayout } from '@/components/layout/CoachLayout';

const CoachDashboard = () => {
  return (
    <CoachLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Coach</h1>
        <p className="text-muted-foreground">Interface coach en cours de développement.</p>
      </div>
    </CoachLayout>
  );
};

export default CoachDashboard;