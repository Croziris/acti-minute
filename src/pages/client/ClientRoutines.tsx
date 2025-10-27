import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { RoutineTracker } from '@/components/routines/RoutineTracker';

const ClientRoutines = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Routines</h1>
          <p className="text-muted-foreground">
            Suivez vos routines d'exercices et de relaxation pour améliorer votre bien-être.
          </p>
        </div>
        
        <RoutineTracker />
      </div>
    </ClientLayout>
  );
};

export default ClientRoutines;
