import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, Dumbbell } from 'lucide-react';
import { CircuitExerciseCard } from './CircuitExerciseCard';

interface Exercise {
  exercise_id: string;
  order_index?: number;
  reps?: number | null;
  temps_seconds?: number | null;
  charge_cible?: number | null;
  tips?: string | null;
  variations?: string | null;
  exercise: {
    id: string;
    libelle: string;
    description?: string;
    video_id?: string;
    youtube_url?: string;
    categories: string[];
    groupes: string[];
  };
}

interface CircuitTrainingViewProps {
  exercises: Exercise[];
  circuitRounds: number;
  restTime: number;
  sessionId: string;
  onRoundComplete: (round: number) => void;
  onAllComplete: () => void;
}

export const CircuitTrainingView: React.FC<CircuitTrainingViewProps> = ({
  exercises,
  circuitRounds,
  restTime,
  sessionId,
  onRoundComplete,
  onAllComplete
}) => {
  const [completedRounds, setCompletedRounds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(restTime);

  const handleCompleteRound = (roundNumber: number) => {
    onRoundComplete(roundNumber);
    setCompletedRounds(roundNumber);

    if (roundNumber < circuitRounds) {
      // Démarrer le repos entre tours
      setIsResting(true);
      setRestRemaining(restTime);
      
      const interval = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsResting(false);
            return restTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Tous les tours sont terminés
      onAllComplete();
    }
  };

  const progressPercentage = (completedRounds / circuitRounds) * 100;

  return (
    <div className="space-y-6">
      {/* Circuit Info */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Circuit Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progression</span>
            <span className="font-semibold">
              {completedRounds} / {circuitRounds} tours
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Temps de repos entre tours : {restTime}s
          </p>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-6 text-center">
            <Timer className="h-12 w-12 mx-auto mb-4 text-yellow-600 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Temps de repos</h3>
            <p className="text-3xl font-bold text-yellow-600">{restRemaining}s</p>
            <p className="text-sm text-muted-foreground mt-2">
              Préparez-vous pour le tour {completedRounds + 1}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Circuit Exercises List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exercices du circuit</h3>
        {exercises
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map((we, idx) => (
            <CircuitExerciseCard 
              key={we.exercise_id} 
              exercise={we} 
              index={idx}
            />
          ))}
      </div>

      {/* Round Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valider les tours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: circuitRounds }).map((_, idx) => {
              const roundNumber = idx + 1;
              const isCompleted = completedRounds >= roundNumber;
              const isCurrent = completedRounds === roundNumber - 1;

              return (
                <Button
                  key={roundNumber}
                  onClick={() => handleCompleteRound(roundNumber)}
                  disabled={completedRounds < roundNumber - 1 || isCompleted || isResting}
                  variant={isCompleted ? 'default' : isCurrent ? 'outline' : 'ghost'}
                  className="w-full h-14 text-lg"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Tour {roundNumber} - Terminé ✓
                    </>
                  ) : (
                    <>
                      Tour {roundNumber} / {circuitRounds}
                      {isCurrent && ' - En cours'}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
