import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  tips: string | null;
  exercise: {
    libelle: string;
    description: string | null;
  };
}

interface Props {
  workoutId: string;
  workoutType: 'classic' | 'circuit';
  circuitRounds?: number;
}

export const WorkoutEditor: React.FC<Props> = ({ workoutId, workoutType, circuitRounds }) => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectExerciseOpen, setSelectExerciseOpen] = useState(false);
  const { toast } = useToast();

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
      setExercises(data || []);
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
      const maxOrderIndex = exercises.length > 0 
        ? Math.max(...exercises.map(e => e.order_index))
        : -1;

      const { error } = await supabase
        .from('workout_exercise')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          order_index: maxOrderIndex + 1,
          series: workoutType === 'classic' ? 3 : null,
          reps: 10
        });

      if (error) throw error;

      toast({
        title: "Exercice ajouté",
        description: `${exercise.libelle} a été ajouté à la séance`
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Exercices de la séance</h3>
          {workoutType === 'circuit' && circuitRounds && (
            <p className="text-sm text-muted-foreground">
              Circuit à faire {circuitRounds} tour{circuitRounds > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => setSelectExerciseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un exercice
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun exercice dans cette séance</p>
            <Button onClick={() => setSelectExerciseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un exercice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex flex-col gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveExercise(exercise.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveExercise(exercise.id, 'down')}
                        disabled={index === exercises.length - 1}
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
                    onClick={() => handleDeleteExercise(exercise.id)}
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
                        onChange={(e) => handleUpdateExercise(exercise.id, 'series', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="3"
                        min="1"
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Répétitions</Label>
                    <Input
                      type="number"
                      value={exercise.reps || ''}
                      onChange={(e) => handleUpdateExercise(exercise.id, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="10"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Temps (sec)</Label>
                    <Input
                      type="number"
                      value={exercise.temps_seconds || ''}
                      onChange={(e) => handleUpdateExercise(exercise.id, 'temps_seconds', e.target.value ? parseInt(e.target.value) : null)}
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
                      onChange={(e) => handleUpdateExercise(exercise.id, 'charge_cible', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tempo</Label>
                    <Input
                      value={exercise.tempo || ''}
                      onChange={(e) => handleUpdateExercise(exercise.id, 'tempo', e.target.value || null)}
                      placeholder="2-0-2-0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Repos (sec)</Label>
                    <Input
                      type="number"
                      value={exercise.temps_repos_seconds || ''}
                      onChange={(e) => handleUpdateExercise(exercise.id, 'temps_repos_seconds', e.target.value ? parseInt(e.target.value) : null)}
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
                      onChange={(e) => handleUpdateExercise(exercise.id, 'rpe_cible', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="7"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Consignes spécifiques</Label>
                  <Textarea
                    value={exercise.tips || ''}
                    onChange={(e) => handleUpdateExercise(exercise.id, 'tips', e.target.value || null)}
                    placeholder="Consignes particulières pour cet exercice dans cette séance..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectExerciseOpen} onOpenChange={setSelectExerciseOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner un exercice</DialogTitle>
            <DialogDescription>
              Choisissez un exercice à ajouter à cette séance
            </DialogDescription>
          </DialogHeader>
          <ExerciseLibrary
            selectionMode
            onSelectExercise={handleAddExercise}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
