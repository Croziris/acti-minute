import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateRoutineDialog } from '@/components/coach/CreateRoutineDialog';
import { AssignRoutinesDialog } from '@/components/coach/AssignRoutinesDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Routine {
  id: string;
  title: string;
  description: string | null;
  type: 'exercises' | 'video';
  video_url: string | null;
  tips: string[];
  created_at: string;
  exerciseCount?: number;
}

const CoachRoutines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const fetchRoutines = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: routinesData, error } = await supabase
        .from('routines')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch exercise counts for exercise-type routines
      const exerciseRoutineIds = routinesData
        ?.filter(r => r.type === 'exercises')
        .map(r => r.id) || [];

      let exerciseCounts: Record<string, number> = {};

      if (exerciseRoutineIds.length > 0) {
        const { data: exercisesData, error: exError } = await supabase
          .from('routine_exercises')
          .select('routine_id')
          .in('routine_id', exerciseRoutineIds);

        if (!exError && exercisesData) {
          exercisesData.forEach(ex => {
            exerciseCounts[ex.routine_id] = (exerciseCounts[ex.routine_id] || 0) + 1;
          });
        }
      }

      const formattedRoutines: Routine[] = routinesData?.map(routine => ({
        ...routine,
        tips: Array.isArray(routine.tips) ? routine.tips as string[] : [],
        exerciseCount: exerciseCounts[routine.id] || 0
      })) || [];

      setRoutines(formattedRoutines);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
      toast.error('Erreur lors du chargement des routines');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return;

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineToDelete);

      if (error) throw error;

      toast.success('Routine supprimée avec succès');
      setDeleteDialogOpen(false);
      setRoutineToDelete(null);
      fetchRoutines();
    } catch (err: any) {
      console.error('Error deleting routine:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, [user]);

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes Routines</h1>
            <p className="text-muted-foreground">
              Créez et gérez des routines d'exercices pour vos clients
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAssignDialogOpen(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Assigner
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une routine
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : routines.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="font-medium mb-2">Aucune routine créée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre première routine d'exercices
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une routine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routines.map(routine => (
              <Card key={routine.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{routine.title}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {routine.type === 'exercises' ? 'Exercices' : 'Vidéo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {routine.description || 'Pas de description'}
                  </p>
                  {routine.type === 'exercises' && (
                    <p className="text-sm font-medium mb-4">
                      {routine.exerciseCount || 0} exercice(s)
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRoutine(routine);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRoutineToDelete(routine.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateRoutineDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditingRoutine(null);
        }}
        editingRoutine={editingRoutine}
        onSuccess={() => {
          setCreateDialogOpen(false);
          setEditingRoutine(null);
          fetchRoutines();
        }}
      />

      <AssignRoutinesDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        routines={routines}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette routine ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La routine sera supprimée pour tous les clients assignés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CoachLayout>
  );
};

export default CoachRoutines;
