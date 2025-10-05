import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Dumbbell, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

interface SetLog {
  id: string;
  exercise_id: string;
  index_serie: number;
  reps: number | null;
  charge: number | null;
  rpe: number | null;
  commentaire: string | null;
}

interface ExerciseFeedback {
  exercise_id: string;
  plaisir_0_10: number | null;
  difficulte_0_10: number | null;
}

interface SessionDetails {
  id: string;
  statut: string;
  date_demarree: string | null;
  date_terminee: string | null;
  workout: {
    titre: string;
    workout_type: string;
    circuit_rounds: number | null;
    workout_exercises: Array<{
      exercise_id: string;
      order_index: number;
      series: number | null;
      reps: number | null;
      charge_cible: number | null;
      rpe_cible: number | null;
      exercise: {
        libelle: string;
      };
    }>;
  };
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  open,
  onOpenChange,
  sessionId,
}) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<ExerciseFeedback[]>([]);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionDetails();
    }
  }, [open, sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      // Récupérer les détails de la séance
      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .select(`
          id,
          statut,
          date_demarree,
          date_terminee,
          workout:workout_id (
            titre,
            workout_type,
            circuit_rounds,
            workout_exercises:workout_exercise (
              exercise_id,
              order_index,
              series,
              reps,
              charge_cible,
              rpe_cible,
              exercise:exercise_id (
                libelle
              )
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Récupérer les set_logs
      const { data: logsData, error: logsError } = await supabase
        .from('set_log')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_id')
        .order('index_serie');

      if (logsError) throw logsError;

      // Récupérer les feedbacks
      const { data: feedbacksData, error: feedbacksError } = await supabase
        .from('exercise_feedback')
        .select('*')
        .eq('session_id', sessionId);

      if (feedbacksError) throw feedbacksError;

      setSession(sessionData as any);
      setSetLogs(logsData || []);
      setFeedbacks(feedbacksData || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetLogsForExercise = (exerciseId: string) => {
    return setLogs.filter(log => log.exercise_id === exerciseId);
  };

  const getFeedbackForExercise = (exerciseId: string) => {
    return feedbacks.find(fb => fb.exercise_id === exerciseId);
  };

  const calculateSessionDuration = () => {
    if (!session?.date_demarree || !session?.date_terminee) return null;
    const start = new Date(session.date_demarree);
    const end = new Date(session.date_terminee);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return minutes;
  };

  const getStatusInfo = (statut: string) => {
    const config: Record<string, { label: string; icon: any; color: string }> = {
      completed: { label: 'Complétée', icon: CheckCircle2, color: 'text-green-500' },
      skipped: { label: 'Sautée', icon: XCircle, color: 'text-red-500' },
      in_progress: { label: 'En cours', icon: Dumbbell, color: 'text-yellow-500' },
      planned: { label: 'Planifiée', icon: Clock, color: 'text-grey-500' }
    };
    return config[statut] || config.planned;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!session) return null;

  const statusInfo = getStatusInfo(session.statut);
  const StatusIcon = statusInfo.icon;
  const duration = calculateSessionDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            {session.workout.titre}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{statusInfo.label}</Badge>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration} min
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          {session.statut === 'planned' ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Cette séance n'a pas encore été commencée par le client.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Exercices prévus :</h3>
                {session.workout.workout_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((we, idx) => (
                    <Card key={we.exercise_id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {idx + 1}. {we.exercise.libelle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {we.series} × {we.reps} reps
                          {we.charge_cible && ` @ ${we.charge_cible}kg`}
                          {we.rpe_cible && ` (RPE ${we.rpe_cible})`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session.statut === 'in_progress' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Séance en cours... Le client n'a pas encore terminé.
                  </p>
                </div>
              )}
              {session.workout.workout_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((we, idx) => {
                  const logs = getSetLogsForExercise(we.exercise_id);
                  const feedback = getFeedbackForExercise(we.exercise_id);

                  return (
                    <Card key={we.exercise_id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>
                            {idx + 1}. {we.exercise.libelle}
                          </span>
                          {feedback && (
                            <div className="flex items-center gap-3 text-sm font-normal">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                😊 {feedback.plaisir_0_10}/10
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                💪 {feedback.difficulte_0_10}/10
                              </span>
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground mb-3">
                            Prévu: {we.series} × {we.reps} reps
                            {we.charge_cible && ` @ ${we.charge_cible}kg`}
                            {we.rpe_cible && ` (RPE ${we.rpe_cible})`}
                          </div>

                          {logs.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Réalisé:</div>
                              {logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline">Série {log.index_serie}</Badge>
                                    <span className="text-sm">
                                      {log.reps} reps
                                    </span>
                                    {log.charge && (
                                      <span className="text-sm text-muted-foreground">
                                        {log.charge} kg
                                      </span>
                                    )}
                                    {log.rpe && (
                                      <span className="flex items-center gap-1 text-sm">
                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                        RPE {log.rpe}
                                      </span>
                                    )}
                                  </div>
                                  {log.commentaire && (
                                    <span className="text-sm text-muted-foreground italic">
                                      {log.commentaire}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              {session.statut === 'in_progress' 
                                ? 'Pas encore commencé cet exercice'
                                : 'Aucune donnée enregistrée'
                              }
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
