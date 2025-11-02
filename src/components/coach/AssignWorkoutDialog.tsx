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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Dumbbell, Plus, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CombinedWorkoutsBuilder } from './CombinedWorkoutsBuilder';

interface Workout {
  id: string;
  titre: string;
  description: string | null;
  duree_estimee: number | null;
  workout_type: 'classic' | 'circuit';
  session_type?: 'warmup' | 'main' | 'cooldown';
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
  const [mode, setMode] = useState<'single' | 'combined'>('single');
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([]);
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
            session_type: workout.session_type as 'warmup' | 'main' | 'cooldown' | undefined,
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
        description: "Impossible de charger les séances",
        variant: "destructive"
      });
    }
  };

  const getSessionTypeIcon = (type?: string) => {
    switch (type) {
      case 'warmup': return '🔥';
      case 'main': return '💪';
      case 'cooldown': return '🧘';
      default: return '';
    }
  };

  const handleAssignSingle = async () => {
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
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      
      const getISOWeek = (date: Date): number => {
        const target = new Date(date.valueOf());
        const dayNumber = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNumber + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      };
      
      const isoWeek = getISOWeek(weekStart);

      let { data: weekPlan, error: weekPlanError } = await supabase
        .from('week_plan')
        .select('*')
        .eq('program_id', programId)
        .eq('start_date', weekStartStr)
        .eq('end_date', weekEndStr)
        .maybeSingle();

      if (weekPlanError) throw weekPlanError;

      if (!weekPlan) {
        const { data: newWeekPlan, error: createError } = await supabase
          .from('week_plan')
          .insert({
            program_id: programId,
            iso_week: isoWeek,
            start_date: weekStartStr,
            end_date: weekEndStr,
            expected_sessions: 1
          })
          .select()
          .single();

        if (createError) throw createError;
        weekPlan = newWeekPlan;
      } else {
        const { error: updateError } = await supabase
          .from('week_plan')
          .update({ 
            expected_sessions: (weekPlan.expected_sessions || 0) + 1 
          })
          .eq('id', weekPlan.id);

        if (updateError) throw updateError;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .insert({
          client_id: clientId,
          workout_id: selectedTemplate,
          week_plan_id: weekPlan.id,
          index_num: parseInt(sessionNumber),
          statut: 'planned'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      await supabase.from('session_workout').insert({
        session_id: sessionData.id,
        workout_id: selectedTemplate,
        order_index: 0,
      });

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

  const handleAssignCombined = async () => {
    if (selectedWorkouts.length === 0 || !sessionNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une séance et un numéro",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      
      const getISOWeek = (date: Date): number => {
        const target = new Date(date.valueOf());
        const dayNumber = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNumber + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      };
      
      const isoWeek = getISOWeek(weekStart);

      let { data: weekPlan, error: weekPlanError } = await supabase
        .from('week_plan')
        .select('*')
        .eq('program_id', programId)
        .eq('start_date', weekStartStr)
        .eq('end_date', weekEndStr)
        .maybeSingle();

      if (weekPlanError) throw weekPlanError;

      if (!weekPlan) {
        const { data: newWeekPlan, error: createError } = await supabase
          .from('week_plan')
          .insert({
            program_id: programId,
            iso_week: isoWeek,
            start_date: weekStartStr,
            end_date: weekEndStr,
            expected_sessions: 1
          })
          .select()
          .single();

        if (createError) throw createError;
        weekPlan = newWeekPlan;
      } else {
        const { error: updateError } = await supabase
          .from('week_plan')
          .update({ 
            expected_sessions: (weekPlan.expected_sessions || 0) + 1 
          })
          .eq('id', weekPlan.id);

        if (updateError) throw updateError;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .insert({
          client_id: clientId,
          workout_id: null,
          week_plan_id: weekPlan.id,
          index_num: parseInt(sessionNumber),
          statut: 'planned'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const sessionWorkoutLinks = selectedWorkouts.map((workout, index) => ({
        session_id: sessionData.id,
        workout_id: workout.id,
        order_index: index,
      }));

      const { error: linksError } = await supabase
        .from('session_workout')
        .insert(sessionWorkoutLinks);

      if (linksError) throw linksError;

      toast({
        title: "Session combinée créée",
        description: `${selectedWorkouts.length} séance${selectedWorkouts.length > 1 ? 's' : ''} combinée${selectedWorkouts.length > 1 ? 's' : ''} avec succès`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating combined session:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la session combinée",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ajouter une séance au programme</DialogTitle>
          <DialogDescription>
            Choisissez une séance existante ou combinez plusieurs séances
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'combined')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Depuis mes séances
              </TabsTrigger>
              <TabsTrigger value="combined" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Combiner mes séances
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionnez une séance à ajouter au programme
              </p>
              
              <div>
                <Label>Sélectionner une séance</Label>
                <ScrollArea className="h-[500px] mt-2 pr-4">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucune séance disponible</p>
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
                              <div className="flex items-center gap-2">
                                {getSessionTypeIcon(workout.session_type) && (
                                  <span className="text-xl">{getSessionTypeIcon(workout.session_type)}</span>
                                )}
                                <CardTitle className="text-base">{workout.titre}</CardTitle>
                              </div>
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
                  onClick={handleAssignSingle}
                  disabled={!selectedTemplate || loading}
                >
                  {loading ? 'Assignation...' : 'Assigner la séance'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="combined" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assemblez plusieurs séances pour créer une session complète
              </p>
              
              <CombinedWorkoutsBuilder 
                onWorkoutsChange={setSelectedWorkouts}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAssignCombined} 
                  disabled={selectedWorkouts.length === 0 || loading}
                >
                  {loading ? 'Création...' : `Créer la session combinée (${selectedWorkouts.length})`}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
