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
  // États pour gérer les tours et le circuit actif
  const [completedRoundsByCircuit, setCompletedRoundsByCircuit] = useState<Record<number, number>>({});
  const [currentCircuitIndex, setCurrentCircuitIndex] = useState(0);
  const [restingCircuit, setRestingCircuit] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showTransition, setShowTransition] = useState(false);

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
      // Circuit terminé - vérifier s'il reste des circuits
      if (currentCircuitIndex < nombreCircuits - 1) {
        // Afficher la transition vers le prochain circuit
        setShowTransition(true);
      } else {
        // Tous les circuits sont terminés
        onAllComplete();
      }
    }
  };

  const handleStartNextCircuit = () => {
    setShowTransition(false);
    setCurrentCircuitIndex(prev => prev + 1);
  };

  // Calculer le numéro de tour global
  const calculateGlobalTourNumber = (circuitIndex: number, roundInCircuit: number): number => {
    let globalTour = 0;
    for (let i = 0; i < circuitIndex; i++) {
      const config = getCircuitConfig(i + 1);
      globalTour += config.rounds;
    }
    globalTour += roundInCircuit;
    return globalTour;
  };

  // Calculer la progression totale en tours
  const totalRoundsNeeded = Array.from({ length: nombreCircuits }, (_, i) => i + 1)
    .reduce((sum, num) => sum + getCircuitConfig(num).rounds, 0);
  const totalRoundsCompleted = Object.entries(completedRoundsByCircuit)
    .reduce((sum, [_, rounds]) => sum + rounds, 0);
  const progressPercentage = (totalRoundsCompleted / totalRoundsNeeded) * 100;

  // Circuit actuel (1-indexed)
  const currentCircuitNumber = currentCircuitIndex + 1;
  const currentCircuitExercises = (exercisesByCircuit[currentCircuitNumber] || [])
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const currentCircuitConfig = getCircuitConfig(currentCircuitNumber);
  const currentCircuitCompletedRounds = completedRoundsByCircuit[currentCircuitNumber] || 0;
  const currentRoundInCircuit = currentCircuitCompletedRounds + 1;
  const globalTourNumber = calculateGlobalTourNumber(currentCircuitIndex, currentRoundInCircuit);

  return (
    <div className="space-y-6">
      {/* Global Progress */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Circuit Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {nombreCircuits > 1 && (
              <Badge variant="outline" className="text-base">
                Circuit {currentCircuitNumber}/{nombreCircuits}
              </Badge>
            )}
            <Badge variant="default" className="text-base">
              Tour {globalTourNumber}/{totalRoundsNeeded}
            </Badge>
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

      {/* Transition entre circuits */}
      {showTransition && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-2xl font-bold mb-2">
              ✅ Circuit {currentCircuitNumber} terminé !
            </h3>
            <p className="text-muted-foreground mb-6">
              Excellent travail ! 💪 Préparez-vous pour le prochain circuit.
            </p>
            <Button 
              onClick={handleStartNextCircuit} 
              size="lg" 
              className="bg-gradient-primary"
            >
              Démarrer Circuit {currentCircuitNumber + 1}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Circuit actuel uniquement */}
      {!showTransition && (
        <div className="space-y-4">
          {nombreCircuits > 1 && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg px-4 py-1.5">
                Circuit {currentCircuitNumber}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Tour {currentRoundInCircuit} / {currentCircuitConfig.rounds} · {currentCircuitConfig.rest}s repos
              </span>
            </div>
          )}

          {/* Circuit Exercises */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">
              {nombreCircuits > 1 ? `Exercices du circuit ${currentCircuitNumber}` : 'Exercices du circuit'}
            </h3>
            {currentCircuitExercises.map((we, idx) => (
              <CircuitExerciseCard 
                key={we.exercise_id} 
                exercise={we} 
                index={idx}
                sessionId={sessionId}
                roundNumber={globalTourNumber}
              />
            ))}
          </div>

          {/* Round Buttons for current Circuit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Valider les tours {nombreCircuits > 1 ? `- Circuit ${currentCircuitNumber}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: currentCircuitConfig.rounds }).map((_, idx) => {
                  const roundNumber = idx + 1;
                  const isCompleted = currentCircuitCompletedRounds >= roundNumber;
                  const isCurrent = currentCircuitCompletedRounds === roundNumber - 1;
                  const isResting = restingCircuit === currentCircuitNumber;

                  return (
                    <Button
                      key={roundNumber}
                      onClick={() => handleCompleteRound(currentCircuitNumber, roundNumber)}
                      disabled={currentCircuitCompletedRounds < roundNumber - 1 || isCompleted || isResting}
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
                          Tour {roundNumber} / {currentCircuitConfig.rounds}
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
      )}
    </div>
  );
};
