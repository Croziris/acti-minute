import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Dumbbell, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Workout {
  id: string;
  titre: string;
  description: string | null;
  duree_estimee: number | null;
  workout_type: 'classic' | 'circuit';
  circuit_rounds: number | null;
  exercise_count: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  programId: string;
  onSuccess: () => void;
}

export const AssignWorkoutDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  clientId,
  programId,
  onSuccess
}) => {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessionNumber, setSessionNumber] = useState('1');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data: workoutsData, error } = await supabase
        .from('workout')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Compter les exercices pour chaque workout
      const workoutsWithCount = await Promise.all(
        (workoutsData || []).map(async (workout) => {
          const { count } = await supabase
            .from('workout_exercise')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', workout.id);
          
          return {
            id: workout.id,
            titre: workout.titre,
            description: workout.description,
            duree_estimee: workout.duree_estimee,
            workout_type: (workout.workout_type || 'classic') as 'classic' | 'circuit',
            circuit_rounds: workout.circuit_rounds,
            exercise_count: count || 0
          } as Workout;
        })
      );

      setTemplates(workoutsWithCount);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les séances templates",
        variant: "destructive"
      });
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate || !sessionNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une séance et un numéro",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const isoWeek = Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Créer ou récupérer le week_plan
      let { data: weekPlan, error: weekPlanError } = await supabase
        .from('week_plan')
        .select('*')
        .eq('program_id', programId)
        .eq('start_date', format(weekStart, 'yyyy-MM-dd'))
        .maybeSingle();

      if (weekPlanError) {
        throw weekPlanError;
      }

      if (!weekPlan) {
        const { data: newWeekPlan, error: createError } = await supabase
          .from('week_plan')
          .insert({
            program_id: programId,
            iso_week: isoWeek,
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(weekEnd, 'yyyy-MM-dd'),
            expected_sessions: 4
          })
          .select()
          .single();

        if (createError) throw createError;
        weekPlan = newWeekPlan;
      }

      // Créer la session
      const { error: sessionError } = await supabase
        .from('session')
        .insert({
          client_id: clientId,
          workout_id: selectedTemplate,
          week_plan_id: weekPlan.id,
          index_num: parseInt(sessionNumber),
          statut: 'planned'
        });

      if (sessionError) throw sessionError;

      toast({
        title: "Séance assignée",
        description: "La séance a été ajoutée au programme du client"
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning workout:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner la séance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = () => {
    // TODO: Implémenter la création de séance personnalisée
    toast({
      title: "À venir",
      description: "Cette fonctionnalité sera bientôt disponible"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ajouter une séance au programme</DialogTitle>
          <DialogDescription>
            Choisissez une séance template ou créez une séance personnalisée
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'template' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template">Depuis mes séances</TabsTrigger>
            <TabsTrigger value="custom">Séance unique</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Semaine</Label>
                <Input
                  type="date"
                  value={format(weekStart, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Du {format(weekStart, 'dd MMM', { locale: fr })} au{' '}
                  {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <Label>Numéro de séance</Label>
                <Input
                  type="number"
                  min="1"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  placeholder="1, 2, 3..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Position dans la semaine
                </p>
              </div>
            </div>

            <div>
              <Label>Sélectionner une séance</Label>
              <ScrollArea className="h-[400px] mt-2 pr-4">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune séance template disponible</p>
                    <p className="text-sm mt-2">Créez d'abord des séances dans "Mes Séances"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((workout) => (
                      <Card
                        key={workout.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === workout.id
                            ? 'ring-2 ring-primary'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTemplate(workout.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{workout.titre}</CardTitle>
                            <Badge variant={workout.workout_type === 'circuit' ? 'default' : 'secondary'}>
                              {workout.workout_type === 'circuit' ? 'Circuit' : 'Classique'}
                            </Badge>
                          </div>
                          {workout.description && (
                            <CardDescription className="text-sm">
                              {workout.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {workout.duree_estimee && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{workout.duree_estimee} min</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Dumbbell className="h-4 w-4" />
                              <span>{workout.exercise_count} exercice{workout.exercise_count > 1 ? 's' : ''}</span>
                            </div>
                            {workout.workout_type === 'circuit' && workout.circuit_rounds && (
                              <Badge variant="outline">
                                {workout.circuit_rounds} tour{workout.circuit_rounds > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAssignTemplate}
                disabled={!selectedTemplate || loading}
              >
                {loading ? 'Assignation...' : 'Assigner la séance'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                La création de séances personnalisées sera bientôt disponible
              </p>
              <Button variant="outline" onClick={() => setMode('template')}>
                Utiliser une séance template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
