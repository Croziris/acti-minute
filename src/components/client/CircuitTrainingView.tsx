import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Timer, CheckCircle, Dumbbell } from 'lucide-react';
import { CircuitExerciseCard } from './CircuitExerciseCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  // États pour gérer les tours et le circuit actif
  const [completedRoundsByCircuit, setCompletedRoundsByCircuit] = useState<Record<number, number>>({});
  const [currentCircuitIndex, setCurrentCircuitIndex] = useState(0);
  const [restingCircuit, setRestingCircuit] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  
  // États pour les feedbacks
  const [showCircuitFeedback, setShowCircuitFeedback] = useState(false);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [completedCircuitNumber, setCompletedCircuitNumber] = useState(0);
  const [circuitRPE, setCircuitRPE] = useState(5);
  const [circuitDifficulte, setCircuitDifficulte] = useState(5);
  const [circuitPlaisir, setCircuitPlaisir] = useState(5);
  const [sessionRPE, setSessionRPE] = useState(5);
  const [sessionDifficulte, setSessionDifficulte] = useState(5);
  const [sessionPlaisir, setSessionPlaisir] = useState(5);
  const [sessionComment, setSessionComment] = useState('');
  
  // Stocker les données de tous les exercices par circuit et tour
  const [exerciseData, setExerciseData] = useState<Record<string, { reps: number; charge: number }>>({});

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

  const handleExerciseDataChange = (exerciseId: string, data: { reps: number; charge: number }) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: data
    }));
  };

  const handleValidateTour = async () => {
    const config = getCircuitConfig(currentCircuitNumber);
    const globalTour = calculateGlobalTourNumber(currentCircuitIndex, currentRoundInCircuit);
    
    // Sauvegarder tous les logs du tour en base de données
    try {
      const logsToSave = currentCircuitExercises.map(ex => {
        const data = exerciseData[ex.exercise_id] || { reps: ex.reps || 0, charge: ex.charge_cible || 0 };
        return {
          session_id: sessionId,
          exercise_id: ex.exercise_id,
          index_serie: globalTour,
          reps: data.reps,
          charge: data.charge || null,
        };
      });
      
      const { error } = await supabase.from('set_log').insert(logsToSave);
      if (error) throw error;

      toast({
        title: "Tour enregistré",
        description: `Tour ${currentRoundInCircuit}/${config.rounds} validé`,
      });
    } catch (error) {
      console.error('Error saving logs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les données",
        variant: "destructive"
      });
      return;
    }
    
    onRoundComplete(globalTour);

    // Mettre à jour l'état des tours complétés
    setCompletedRoundsByCircuit(prev => ({
      ...prev,
      [currentCircuitNumber]: currentRoundInCircuit
    }));

    // CAS 1 : Pas le dernier tour de ce circuit
    if (currentRoundInCircuit < config.rounds) {
      // Démarrer le repos entre tours
      setRestingCircuit(currentCircuitNumber);
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
    } 
    // CAS 2 : Dernier tour de ce circuit, mais pas le dernier circuit
    else if (currentCircuitIndex < nombreCircuits - 1) {
      setCompletedCircuitNumber(currentCircuitNumber);
      setShowCircuitFeedback(true);
    }
    // CAS 3 : Dernier tour du dernier circuit
    else {
      setShowFinalFeedback(true);
    }
  };

  const handleCircuitFeedbackSubmit = async () => {
    try {
      await supabase.from('exercise_feedback').insert({
        session_id: sessionId,
        exercise_id: null,
        feedback_type: 'circuit',
        circuit_number: completedCircuitNumber,
        rpe: circuitRPE,
        difficulte_0_10: circuitDifficulte,
        plaisir_0_10: circuitPlaisir,
      });

      setShowCircuitFeedback(false);
      setShowTransition(true);
      
      // Reset des valeurs pour le prochain circuit
      setCircuitRPE(5);
      setCircuitDifficulte(5);
      setCircuitPlaisir(5);
    } catch (error) {
      console.error('Error saving circuit feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le feedback",
        variant: "destructive"
      });
    }
  };

  const handleFinalFeedbackSubmit = async () => {
    try {
      await supabase.from('exercise_feedback').insert({
        session_id: sessionId,
        exercise_id: null,
        feedback_type: 'session',
        circuit_number: null,
        rpe: sessionRPE,
        difficulte_0_10: sessionDifficulte,
        plaisir_0_10: sessionPlaisir,
      });

      setShowFinalFeedback(false);
      onAllComplete();
    } catch (error) {
      console.error('Error saving final feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le feedback",
        variant: "destructive"
      });
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
                onExerciseDataChange={handleExerciseDataChange}
              />
            ))}
          </div>

          {/* Bouton de validation global */}
          <Card className="sticky bottom-4 mt-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <Button 
                onClick={handleValidateTour}
                disabled={restingCircuit !== null}
                size="lg"
                className="w-full"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-semibold">
                    Tour {currentRoundInCircuit}/{currentCircuitConfig.rounds}
                    {currentRoundInCircuit <= currentCircuitConfig.rounds && " - En cours"}
                  </span>
                  
                  {restingCircuit === null ? (
                    <span className="text-sm opacity-90">
                      Appuyer pour finir le tour
                    </span>
                  ) : (
                    <span className="text-sm opacity-75">
                      Repos en cours...
                    </span>
                  )}
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de feedback entre circuits */}
      <Dialog open={showCircuitFeedback} onOpenChange={setShowCircuitFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ✅ Circuit {completedCircuitNumber} terminé !
            </DialogTitle>
            <DialogDescription>
              Comment avez-vous trouvé ce circuit ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* RPE - Effort perçu */}
            <div>
              <Label>RPE - Effort perçu (1-10)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                1 = Très facile | 5 = Modéré | 10 = Effort maximal
              </p>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[circuitRPE]}
                onValueChange={(value) => setCircuitRPE(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{circuitRPE}/10</p>
            </div>
            
            {/* Difficulté technique */}
            <div>
              <Label>Difficulté technique (0-10)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                0 = Très facile | 5 = Modéré | 10 = Très difficile
              </p>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[circuitDifficulte]}
                onValueChange={(value) => setCircuitDifficulte(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{circuitDifficulte}/10</p>
            </div>
            
            {/* Plaisir */}
            <div>
              <Label>Plaisir ressenti (0-10)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                0 = Aucun plaisir | 5 = Neutre | 10 = Très plaisant
              </p>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[circuitPlaisir]}
                onValueChange={(value) => setCircuitPlaisir(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{circuitPlaisir}/10</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleCircuitFeedbackSubmit} size="lg" className="w-full">
              Continuer
              {currentCircuitIndex < nombreCircuits - 1 && 
                ` → Circuit ${currentCircuitIndex + 2}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de feedback final */}
      <Dialog open={showFinalFeedback} onOpenChange={setShowFinalFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              🎉 Séance terminée !
            </DialogTitle>
            <DialogDescription>
              Comment s'est passée la séance globale ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* RPE global */}
            <div>
              <Label>RPE moyen de la séance (1-10)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Évaluez l'effort global de toute la séance
              </p>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[sessionRPE]}
                onValueChange={(value) => setSessionRPE(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{sessionRPE}/10</p>
            </div>
            
            {/* Difficulté globale */}
            <div>
              <Label>Difficulté technique globale (0-10)</Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[sessionDifficulte]}
                onValueChange={(value) => setSessionDifficulte(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{sessionDifficulte}/10</p>
            </div>
            
            {/* Plaisir global */}
            <div>
              <Label>Plaisir global (0-10)</Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[sessionPlaisir]}
                onValueChange={(value) => setSessionPlaisir(value[0])}
              />
              <p className="text-center text-2xl font-bold mt-2">{sessionPlaisir}/10</p>
            </div>
            
            {/* Commentaire optionnel */}
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                placeholder="Comment vous êtes-vous senti pendant cette séance ?"
                value={sessionComment}
                onChange={(e) => setSessionComment(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleFinalFeedbackSubmit} size="lg" className="w-full">
              Terminer la séance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
