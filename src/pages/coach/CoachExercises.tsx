import React from 'react';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';

const CoachExercises = () => {
  return (
    <CoachLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Banque d'exercices</h1>
          <p className="text-muted-foreground">
            Gérez votre bibliothèque d'exercices : créez, modifiez et organisez tous vos exercices.
          </p>
        </div>
        
        <ExerciseLibrary />
      </div>
    </CoachLayout>
  );
};

export default CoachExercises;
