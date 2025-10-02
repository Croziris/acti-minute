import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Workout {
  id: string;
  titre: string;
  description?: string;
  duree_estimee?: number;
  exercises?: WorkoutExercise[];
  workout_exercise?: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  order_index: number;
  series?: number;
  reps?: number;
  tempo?: string;
  tips?: string;
  exercise: {
    id: string;
    libelle: string;
    description?: string;
  };
}

interface Props {
  programId: string;
  clientId: string;
}

export const ProgramBuilder: React.FC<Props> = ({ programId, clientId }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [newWorkoutDesc, setNewWorkoutDesc] = useState('');
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkouts();
  }, [programId]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workout')
        .select(`
          id,
          titre,
          description,
          duree_estimee,
          workout_exercise (
            id,
            order_index,
            series,
            reps,
            tempo,
            tips,
            exercise:exercise_id (
              id,
              libelle,
              description
            )
          )
        `)
        .eq('program_id', programId)
        .order('created_at');

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les séances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async () => {
    if (!newWorkoutTitle.trim()) return;

    try {
      const { error } = await supabase.from('workout').insert({
        titre: newWorkoutTitle,
        description: newWorkoutDesc,
        program_id: programId,
      });

      if (error) throw error;

      toast({ title: 'Séance créée avec succès' });
      setNewWorkoutTitle('');
      setNewWorkoutDesc('');
      setShowNewWorkout(false);
      fetchWorkouts();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la séance',
        variant: 'destructive',
      });
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase.from('workout').delete().eq('id', workoutId);
      if (error) throw error;

      toast({ title: 'Séance supprimée' });
      fetchWorkouts();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la séance',
        variant: 'destructive',
      });
    }
  };

  const handleSelectExercise = async (exercise: any) => {
    if (!selectedWorkoutId) return;

    try {
      const { data, error } = await supabase.functions.invoke('add-exercise-to-workout', {
        body: {
          workout_id: selectedWorkoutId,
          exercise_id: exercise.id,
          series: 3,
          reps: 10,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Erreur',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Exercice ajouté à la séance' });
      setShowExerciseLibrary(false);
      fetchWorkouts();
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'exercice',
        variant: 'destructive',
      });
    }
  };

  const removeExerciseFromWorkout = async (workoutExerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercise')
        .delete()
        .eq('id', workoutExerciseId);

      if (error) throw error;

      toast({ title: 'Exercice retiré de la séance' });
      fetchWorkouts();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer l\'exercice',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Séances d'entraînement</h2>
        <Button onClick={() => setShowNewWorkout(!showNewWorkout)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle séance
        </Button>
      </div>

      {showNewWorkout && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle séance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Titre de la séance"
              value={newWorkoutTitle}
              onChange={(e) => setNewWorkoutTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optionnel)"
              value={newWorkoutDesc}
              onChange={(e) => setNewWorkoutDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={createWorkout}>Créer</Button>
              <Button variant="outline" onClick={() => setShowNewWorkout(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{workout.titre}</CardTitle>
                  {workout.description && (
                    <CardDescription>{workout.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkoutId(workout.id);
                      setShowExerciseLibrary(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter exercice
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteWorkout(workout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {workout.workout_exercise && workout.workout_exercise.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {workout.workout_exercise
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((we: any) => (
                      <div
                        key={we.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{we.exercise.libelle}</div>
                          <div className="text-sm text-muted-foreground">
                            {we.series} séries × {we.reps} reps
                            {we.tempo && ` • Tempo: ${we.tempo}`}
                          </div>
                          {we.tips && (
                            <div className="text-sm text-muted-foreground mt-1">
                              💡 {we.tips}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExerciseFromWorkout(we.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={showExerciseLibrary} onOpenChange={setShowExerciseLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner un exercice</DialogTitle>
            <DialogDescription>
              Choisissez un exercice à ajouter à cette séance
            </DialogDescription>
          </DialogHeader>
          <ExerciseLibrary
            onSelectExercise={handleSelectExercise}
            selectionMode={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
