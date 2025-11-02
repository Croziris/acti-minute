import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  series: number | null;
  reps: number | null;
  temps_seconds: number | null;
  charge_cible: number | null;
  tempo: string | null;
  temps_repos_seconds: number | null;
  rpe_cible: number | null;
  couleur_elastique: string | null;
  circuit_number: number;
  tips: string | null;
  section: 'warmup' | 'main' | 'cooldown';
  exercise: {
    libelle: string;
    description: string | null;
  };
}

interface Props {
  workoutId: string;
  workoutType: 'classic' | 'circuit';
  circuitRounds?: number;
  nombreCircuits?: number;
  circuitConfigs?: Array<{ rounds: number; rest: number }>;
}

export const WorkoutEditor: React.FC<Props> = ({ 
  workoutId, 
  workoutType, 
  circuitRounds, 
  nombreCircuits = 1,
  circuitConfigs = [{ rounds: 3, rest: 60 }]
}) => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectExerciseOpen, setSelectExerciseOpen] = useState(false);
  const [selectedCircuitForAdd, setSelectedCircuitForAdd] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<'warmup' | 'main' | 'cooldown'>('main');
  const { toast } = useToast();

  // Grouper les exercices par section et par circuit
  const exercisesBySection = React.useMemo(() => {
    return {
      warmup: exercises.filter(e => e.section === 'warmup').sort((a, b) => a.order_index - b.order_index),
      main: exercises.filter(e => e.section === 'main').sort((a, b) => a.order_index - b.order_index),
      cooldown: exercises.filter(e => e.section === 'cooldown').sort((a, b) => a.order_index - b.order_index),
    };
  }, [exercises]);

  const exercisesByCircuit = exercises.reduce((acc, exercise) => {
    const circuitNum = exercise.circuit_number || 1;
    if (!acc[circuitNum]) acc[circuitNum] = [];
    acc[circuitNum].push(exercise);
    return acc;
  }, {} as Record<number, WorkoutExercise[]>);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_exercise')
        .select(`
          *,
          exercise:exercise_id (
            libelle,
            description
          )
        `)
        .eq('workout_id', workoutId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setExercises((data || []) as WorkoutExercise[]);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les exercices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [workoutId]);

  const handleAddExercise = async (exercise: any) => {
    try {
      // Calculer le prochain order_index pour cette section
      const exercisesInSection = exercises.filter(e => e.section === selectedSection);
      const maxOrderIndex = exercisesInSection.length > 0 
        ? Math.max(...exercisesInSection.map(e => e.order_index))
        : -1;

      const { error } = await supabase
        .from('workout_exercise')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          order_index: maxOrderIndex + 1,
          series: workoutType === 'classic' ? 3 : null,
          reps: 10,
          circuit_number: selectedCircuitForAdd,
          section: selectedSection
        });

      if (error) throw error;

      const sectionLabels = {
        warmup: 'Échauffement',
        main: 'Corps de séance',
        cooldown: 'Retour au calme'
      };

      toast({
        title: "Exercice ajouté",
        description: `${exercise.libelle} a été ajouté à ${sectionLabels[selectedSection]}`
      });

      setSelectExerciseOpen(false);
      fetchExercises();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'exercice",
        variant: "destructive"
      });
    }
  };

  const openAddExerciseDialog = (circuitNumber: number = 1, section: 'warmup' | 'main' | 'cooldown' = 'main') => {
    setSelectedCircuitForAdd(circuitNumber);
    setSelectedSection(section);
    setSelectExerciseOpen(true);
  };

  const handleUpdateExercise = async (exerciseId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('workout_exercise')
        .update({ [field]: value })
        .eq('id', exerciseId);

      if (error) throw error;

      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ));
    } catch (error: any) {
      console.error('Error updating exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'exercice",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercise')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      toast({
        title: "Exercice supprimé",
        description: "L'exercice a été retiré de la séance"
      });

      fetchExercises();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'exercice",
        variant: "destructive"
      });
    }
  };

  const handleMoveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === exercises.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newExercises = [...exercises];
    [newExercises[currentIndex], newExercises[newIndex]] = [newExercises[newIndex], newExercises[currentIndex]];

    try {
      // Mettre à jour les order_index
      await Promise.all(
        newExercises.map((ex, idx) =>
          supabase
            .from('workout_exercise')
            .update({ order_index: idx })
            .eq('id', ex.id)
        )
      );

      setExercises(newExercises);
    } catch (error: any) {
      console.error('Error moving exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déplacer l'exercice",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {workoutType === 'circuit' && nombreCircuits > 1 ? (
        // Affichage par circuit pour les séances multi-circuits
        <div className="space-y-6">
          {Array.from({ length: nombreCircuits }, (_, i) => i + 1).map(circuitNum => {
            const circuitExercises = exercisesByCircuit[circuitNum] || [];
            const config = circuitConfigs[circuitNum - 1] || { rounds: 3, rest: 60 };
            
            return (
              <Card key={circuitNum} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">Circuit {circuitNum}</CardTitle>
                      <Badge variant="secondary">
                        {config.rounds} tours · {config.rest}s de repos
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openAddExerciseDialog(circuitNum)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un exercice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {circuitExercises.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Aucun exercice dans ce circuit
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAddExerciseDialog(circuitNum)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le premier exercice
                      </Button>
                    </div>
                  ) : (
                    circuitExercises
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((exercise, index) => (
                        <ExerciseEditorCard
                          key={exercise.id}
                          exercise={exercise}
                          index={index}
                          totalExercises={circuitExercises.length}
                          workoutType={workoutType}
                          nombreCircuits={nombreCircuits}
                          onUpdate={handleUpdateExercise}
                          onDelete={handleDeleteExercise}
                          onMove={handleMoveExercise}
                        />
                      ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Affichage par section pour les séances classiques ou single circuit
        <div className="space-y-6">
          {/* Section Échauffement */}
          {(exercisesBySection.warmup.length > 0 || true) && (
            <Card className="border-2 border-orange-500/30">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <CardTitle className="text-lg">Échauffement</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Préparation (sans feedback)
                      </p>
                    </div>
                    <Badge variant="outline">{exercisesBySection.warmup.length}</Badge>
                  </div>
                  <Button size="sm" onClick={() => openAddExerciseDialog(1, 'warmup')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              {exercisesBySection.warmup.length > 0 && (
                <CardContent className="space-y-3 pt-6">
                  {exercisesBySection.warmup.map((exercise, index) => (
                    <ExerciseEditorCard
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      totalExercises={exercisesBySection.warmup.length}
                      workoutType={workoutType}
                      nombreCircuits={nombreCircuits}
                      onUpdate={handleUpdateExercise}
                      onDelete={handleDeleteExercise}
                      onMove={handleMoveExercise}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Section Corps de séance */}
          <Card className="border-2 border-blue-500/30">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💪</span>
                  <div>
                    <CardTitle className="text-lg">Corps de séance</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exercices principaux (avec feedback)
                    </p>
                  </div>
                  <Badge variant="outline">{exercisesBySection.main.length}</Badge>
                </div>
                <Button size="sm" onClick={() => openAddExerciseDialog(1, 'main')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {exercisesBySection.main.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Aucun exercice dans le corps de séance
                  </p>
                  <Button variant="outline" size="sm" onClick={() => openAddExerciseDialog(1, 'main')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un exercice
                  </Button>
                </div>
              ) : (
                exercisesBySection.main.map((exercise, index) => (
                  <ExerciseEditorCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    totalExercises={exercisesBySection.main.length}
                    workoutType={workoutType}
                    nombreCircuits={nombreCircuits}
                    onUpdate={handleUpdateExercise}
                    onDelete={handleDeleteExercise}
                    onMove={handleMoveExercise}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Section Retour au calme */}
          {(exercisesBySection.cooldown.length > 0 || true) && (
            <Card className="border-2 border-green-500/30">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧘</span>
                    <div>
                      <CardTitle className="text-lg">Retour au calme</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Récupération (optionnel, sans feedback)
                      </p>
                    </div>
                    <Badge variant="outline">{exercisesBySection.cooldown.length}</Badge>
                  </div>
                  <Button size="sm" onClick={() => openAddExerciseDialog(1, 'cooldown')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              {exercisesBySection.cooldown.length > 0 && (
                <CardContent className="space-y-3 pt-6">
                  {exercisesBySection.cooldown.map((exercise, index) => (
                    <ExerciseEditorCard
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      totalExercises={exercisesBySection.cooldown.length}
                      workoutType={workoutType}
                      nombreCircuits={nombreCircuits}
                      onUpdate={handleUpdateExercise}
                      onDelete={handleDeleteExercise}
                      onMove={handleMoveExercise}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      <Dialog open={selectExerciseOpen} onOpenChange={setSelectExerciseOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner un exercice</DialogTitle>
            <DialogDescription>
              {selectedSection === 'warmup' && '🔥 Échauffement - Exercices de préparation (sans feedback)'}
              {selectedSection === 'main' && '💪 Corps de séance - Exercices principaux (avec feedback)'}
              {selectedSection === 'cooldown' && '🧘 Retour au calme - Récupération (optionnel, sans feedback)'}
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Select value={selectedSection} onValueChange={(value: 'warmup' | 'main' | 'cooldown') => setSelectedSection(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup">
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    <span>Échauffement</span>
                  </div>
                </SelectItem>
                <SelectItem value="main">
                  <div className="flex items-center gap-2">
                    <span>💪</span>
                    <span>Corps de séance</span>
                  </div>
                </SelectItem>
                <SelectItem value="cooldown">
                  <div className="flex items-center gap-2">
                    <span>🧘</span>
                    <span>Retour au calme</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ExerciseLibrary
            selectionMode
            onSelectExercise={handleAddExercise}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Composant séparé pour l'édition d'un exercice
interface ExerciseEditorCardProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  workoutType: 'classic' | 'circuit';
  nombreCircuits: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

const ExerciseEditorCard: React.FC<ExerciseEditorCardProps> = ({
  exercise,
  index,
  totalExercises,
  workoutType,
  nombreCircuits,
  onUpdate,
  onDelete,
  onMove
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex flex-col gap-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMove(exercise.id, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMove(exercise.id, 'down')}
                disabled={index === totalExercises - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">
                {index + 1}. {exercise.exercise.libelle}
              </CardTitle>
              {exercise.exercise.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {exercise.exercise.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(exercise.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {workoutType === 'classic' && (
            <div>
              <Label className="text-xs">Séries</Label>
              <Input
                type="number"
                value={exercise.series || ''}
                onChange={(e) => onUpdate(exercise.id, 'series', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="3"
                min="1"
              />
            </div>
          )}
          {nombreCircuits > 1 && (
            <div>
              <Label className="text-xs">Circuit n°</Label>
              <Select
                value={exercise.circuit_number?.toString() || '1'}
                onValueChange={(value) => onUpdate(exercise.id, 'circuit_number', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: nombreCircuits }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      Circuit {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Répétitions</Label>
            <Input
              type="number"
              value={exercise.reps || ''}
              onChange={(e) => onUpdate(exercise.id, 'reps', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="10"
              min="1"
            />
          </div>
          <div>
            <Label className="text-xs">Temps (sec)</Label>
            <Input
              type="number"
              value={exercise.temps_seconds || ''}
              onChange={(e) => onUpdate(exercise.id, 'temps_seconds', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="30"
              min="1"
            />
          </div>
          <div>
            <Label className="text-xs">Charge (kg)</Label>
            <Input
              type="number"
              step="0.5"
              value={exercise.charge_cible || ''}
              onChange={(e) => onUpdate(exercise.id, 'charge_cible', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="20"
            />
          </div>
          <div>
            <Label className="text-xs">Tempo</Label>
            <Input
              value={exercise.tempo || ''}
              onChange={(e) => onUpdate(exercise.id, 'tempo', e.target.value || null)}
              placeholder="2-0-2-0"
            />
          </div>
          <div>
            <Label className="text-xs">Repos (sec)</Label>
            <Input
              type="number"
              value={exercise.temps_repos_seconds || ''}
              onChange={(e) => onUpdate(exercise.id, 'temps_repos_seconds', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="60"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs">RPE cible</Label>
            <Input
              type="number"
              step="0.5"
              value={exercise.rpe_cible || ''}
              onChange={(e) => onUpdate(exercise.id, 'rpe_cible', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="7"
              min="0"
              max="10"
            />
          </div>
          <div>
            <Label className="text-xs">Couleur élastique</Label>
            <Select
              value={exercise.couleur_elastique || ''}
              onValueChange={(value) => onUpdate(exercise.id, 'couleur_elastique', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                <SelectItem value="Jaune">Jaune</SelectItem>
                <SelectItem value="Rouge">Rouge</SelectItem>
                <SelectItem value="Noir">Noir</SelectItem>
                <SelectItem value="Violet">Violet</SelectItem>
                <SelectItem value="Vert">Vert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Consignes spécifiques</Label>
          <Textarea
            value={exercise.tips || ''}
            onChange={(e) => onUpdate(exercise.id, 'tips', e.target.value || null)}
            placeholder="Consignes particulières pour cet exercice dans cette séance..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
