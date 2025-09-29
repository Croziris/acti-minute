import React from 'react';
import { useParams } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';

const CoachBuilder = () => {
  const { clientId } = useParams();

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Builder - Client {clientId}</h1>
          <p className="text-muted-foreground">
            Créez et gérez les séances d'entraînement pour votre client.
          </p>
        </div>
        
        <ExerciseLibrary />
      </div>
    </CoachLayout>
  );
};

export default CoachBuilder;