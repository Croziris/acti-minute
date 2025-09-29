import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { HabitTracker } from '@/components/habits/HabitTracker';

const ClientHabits = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Habitudes</h1>
          <p className="text-muted-foreground">
            Suivez vos habitudes quotidiennes pour atteindre vos objectifs.
          </p>
        </div>
        
        <HabitTracker />
      </div>
    </ClientLayout>
  );
};

export default ClientHabits;