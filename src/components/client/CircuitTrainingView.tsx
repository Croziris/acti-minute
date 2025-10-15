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
  circuit_number?: number;
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

interface CircuitConfig {
  rounds: number;
  rest: number;
}

interface CircuitTrainingViewProps {
  exercises: Exercise[];
  circuitRounds: number;
  restTime: number;
  sessionId: string;
  nombreCircuits?: number;
  circuitConfigs?: CircuitConfig[];
  onRoundComplete: (round: number) => void;
  onAllComplete: () => void;
}

export const CircuitTrainingView: React.FC<CircuitTrainingViewProps> = ({
  exercises,
  circuitRounds,
  restTime,
  sessionId,
  nombreCircuits = 1,
  circuitConfigs,
  onRoundComplete,
  onAllComplete
}) => {
  // États pour gérer les tours complétés de chaque circuit
  const [completedRoundsByCircuit, setCompletedRoundsByCircuit] = useState<Record<number, number>>({});
  const [restingCircuit, setRestingCircuit] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);

  // Grouper les exercices par circuit
  const exercisesByCircuit = exercises.reduce((acc, exercise) => {
    const circuitNum = exercise.circuit_number || 1;
    if (!acc[circuitNum]) acc[circuitNum] = [];
    acc[circuitNum].push(exercise);
    return acc;
  }, {} as Record<number, Exercise[]>);

  // Calculer la configuration effective (utiliser circuitConfigs si disponible, sinon fallback)
  const getCircuitConfig = (circuitNumber: number): CircuitConfig => {
    if (circuitConfigs && circuitConfigs[circuitNumber - 1]) {
      return circuitConfigs[circuitNumber - 1];
    }
    return { rounds: circuitRounds, rest: restTime };
  };

  const handleCompleteRound = (circuitNumber: number, roundNumber: number) => {
    const config = getCircuitConfig(circuitNumber);
    
    onRoundComplete(roundNumber);
    setCompletedRoundsByCircuit(prev => ({
      ...prev,
      [circuitNumber]: roundNumber
    }));

    if (roundNumber < config.rounds) {
      // Démarrer le repos entre tours
      setRestingCircuit(circuitNumber);
      setRestRemaining(config.rest);
      
      const interval = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setRestingCircuit(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Vérifier si tous les circuits sont terminés
      const allCompleted = Array.from({ length: nombreCircuits }, (_, i) => i + 1)
        .every(num => {
          const config = getCircuitConfig(num);
          const completed = num === circuitNumber ? roundNumber : (completedRoundsByCircuit[num] || 0);
          return completed >= config.rounds;
        });
      
      if (allCompleted) {
        onAllComplete();
      }
    }
  };

  // Calculer la progression totale
  const totalRoundsNeeded = Array.from({ length: nombreCircuits }, (_, i) => i + 1)
    .reduce((sum, num) => sum + getCircuitConfig(num).rounds, 0);
  const totalRoundsCompleted = Object.entries(completedRoundsByCircuit)
    .reduce((sum, [_, rounds]) => sum + rounds, 0);
  const progressPercentage = (totalRoundsCompleted / totalRoundsNeeded) * 100;

  return (
    <div className="space-y-6">
      {/* Global Progress */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Circuit Training {nombreCircuits > 1 ? `- ${nombreCircuits} circuits` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progression globale</span>
            <span className="font-semibold">
              {totalRoundsCompleted} / {totalRoundsNeeded} tours
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {restingCircuit !== null && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-6 text-center">
            <Timer className="h-12 w-12 mx-auto mb-4 text-yellow-600 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Repos - Circuit {restingCircuit}</h3>
            <p className="text-3xl font-bold text-yellow-600">{restRemaining}s</p>
            <p className="text-sm text-muted-foreground mt-2">
              Préparez-vous pour le prochain tour
            </p>
          </CardContent>
        </Card>
      )}

      {/* Circuits */}
      {Array.from({ length: nombreCircuits }, (_, i) => i + 1).map(circuitNumber => {
        const circuitExercises = (exercisesByCircuit[circuitNumber] || [])
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        const config = getCircuitConfig(circuitNumber);
        const completedRounds = completedRoundsByCircuit[circuitNumber] || 0;
        const circuitProgress = (completedRounds / config.rounds) * 100;

        return (
          <div key={circuitNumber} className="space-y-4">
            {nombreCircuits > 1 && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-1.5">
                  Circuit {circuitNumber}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {completedRounds} / {config.rounds} tours · {config.rest}s repos
                </span>
              </div>
            )}

            {/* Circuit Exercises */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">
                {nombreCircuits > 1 ? `Exercices du circuit ${circuitNumber}` : 'Exercices du circuit'}
              </h3>
              {circuitExercises.map((we, idx) => (
                <CircuitExerciseCard 
                  key={we.exercise_id} 
                  exercise={we} 
                  index={idx}
                />
              ))}
            </div>

            {/* Round Buttons for this Circuit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Valider les tours {nombreCircuits > 1 ? `- Circuit ${circuitNumber}` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: config.rounds }).map((_, idx) => {
                    const roundNumber = idx + 1;
                    const isCompleted = completedRounds >= roundNumber;
                    const isCurrent = completedRounds === roundNumber - 1;
                    const isResting = restingCircuit === circuitNumber;

                    return (
                      <Button
                        key={roundNumber}
                        onClick={() => handleCompleteRound(circuitNumber, roundNumber)}
                        disabled={completedRounds < roundNumber - 1 || isCompleted || isResting}
                        variant={isCompleted ? 'default' : isCurrent ? 'outline' : 'ghost'}
                        className="w-full h-12"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Tour {roundNumber} - Terminé ✓
                          </>
                        ) : (
                          <>
                            Tour {roundNumber} / {config.rounds}
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
      })}
    </div>
  );
};
