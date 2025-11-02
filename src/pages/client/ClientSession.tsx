import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseCard } from "@/components/session/ExerciseCard";
import { CircuitTrainingView } from "@/components/client/CircuitTrainingView";
import { SessionCompleteCard } from "@/components/session/SessionCompleteCard";
import { useSessionData } from "@/hooks/useSessionData";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, ArrowLeft, MessageCircle } from "lucide-react";

const ClientSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, loading, error } = useSessionData(sessionId);
  const { addOfflineData, isOnline } = useOfflineSync();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [commentaireFin, setCommentaireFin] = useState("");
  const [coachPhone, setCoachPhone] = useState<string>('');

  useEffect(() => {
    if (session?.statut === "ongoing") {
      setSessionStarted(true);
    }
    if (session?.statut === "done") {
      setSessionCompleted(true);
    }
    
    // Charger les informations du coach pour WhatsApp
    if (session?.client_id) {
      supabase
        .from('program')
        .select('coach_id, app_user!program_coach_id_fkey(phone)')
        .eq('client_id', session.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.app_user?.phone) {
            setCoachPhone(data.app_user.phone);
          }
        });
    }
  }, [session]);

  const startSession = async () => {
    if (!session || !user) return;

    try {
      const updateData = {
        statut: "ongoing",
        date_demarree: new Date().toISOString(),
      };

      if (isOnline) {
        const { error } = await supabase
          .from("session")
          .update(updateData)
          .eq("id", session.id)
          .eq("client_id", user.id);

        if (error) throw error;
      } else {
        addOfflineData("session_update", {
          sessionId: session.id,
          updates: updateData,
        });
      }

      setSessionStarted(true);

      toast({
        title: "Séance démarrée",
        description: "Bon entraînement !",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la séance",
        variant: "destructive",
      });
    }
  };

  const completeSession = async () => {
    if (!session || !user) return;

    try {
      const updateData = {
        statut: "done",
        date_terminee: new Date().toISOString(),
        commentaire_fin: commentaireFin || null,
      };

      if (isOnline) {
        const { error } = await supabase
          .from("session")
          .update(updateData)
          .eq("id", session.id)
          .eq("client_id", user.id);

        if (error) throw error;
      } else {
        addOfflineData("session_update", {
          sessionId: session.id,
          updates: updateData,
        });
      }

      setSessionCompleted(true);

      toast({
        title: "Séance terminée",
        description: "Félicitations ! Séance complétée avec succès.",
      });
    } catch (error) {
      console.error("Error completing session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la séance",
        variant: "destructive",
      });
    }
  };

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises((prev) => new Set(prev).add(exerciseId));
  };

  const handleRoundComplete = async (roundNumber: number) => {
    if (!session || !user) return;

    // Pour circuit training, on peut logger le tour complété
    toast({
      title: `Tour ${roundNumber} terminé`,
      description: `Encore ${session.workout.circuit_rounds! - roundNumber} tour(s) !`,
    });
  };

  const handleCircuitComplete = () => {
    console.log("🎉 handleCircuitComplete appelé dans ClientSession");
    // Marquer tous les exercices comme complétés
    const allExerciseIds = exercises.map((e) => e.exercise.id);
    setCompletedExercises(new Set(allExerciseIds));
    setSessionCompleted(true);
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (error || !session) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Séance introuvable</h2>
            <p className="text-muted-foreground mb-4">
              {error || "Cette séance n'existe pas ou vous n'y avez pas accès."}
            </p>
            <Button onClick={() => navigate("/client/home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const exercises = session.workout?.workout_exercise || [];
  const isCircuitWorkout = session.workout?.workout_type === "circuit";
  
  // Pour les circuits, on compte les tours, pas les exercices
  const circuitConfigs = session.workout?.circuit_configs as Array<{rounds: number, rest: number}> | undefined;
  const totalRounds = isCircuitWorkout 
    ? (circuitConfigs || [{ rounds: session.workout.circuit_rounds || 3, rest: 60 }])
        .reduce((sum, config) => sum + config.rounds, 0)
    : 0;
  
  const completionRate = isCircuitWorkout 
    ? 0 // La progression est gérée dans CircuitTrainingView
    : exercises.length > 0 
      ? (completedExercises.size / exercises.length) * 100 
      : 0;
  
  const canComplete = isCircuitWorkout 
    ? completedExercises.size === exercises.length // Tous les exercices marqués comme complétés par le circuit
    : completionRate >= 100 || completedExercises.size === exercises.length;

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/client/home")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Badge
                variant={session.statut === "done" ? "default" : session.statut === "ongoing" ? "secondary" : "outline"}
              >
                {session.statut === "done" ? "Terminée" : session.statut === "ongoing" ? "En cours" : "À faire"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{session.workout?.titre || `Séance ${session.index_num}`}</h1>
            {session.workout?.description && (
              <p className="text-muted-foreground mt-1">{session.workout.description}</p>
            )}
          </div>
        </div>

        {/* Progress - Affichage différent pour circuits */}
        {exercises.length > 0 && !isCircuitWorkout && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm text-muted-foreground">
                  {completedExercises.size}/{exercises.length} exercices
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Session Button */}
        {!sessionStarted && session.statut === "planned" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Prêt à commencer ?</h3>
                <p className="text-muted-foreground mb-4">
                  {session.workout?.duree_estimee && `Durée estimée: ${session.workout.duree_estimee} minutes`}
                </p>
              </div>

              {/* Exercise Preview */}
              {exercises.length > 0 && (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-3">Voici les exercices de ta séance d'aujourd'hui :</p>
                  <ul className="space-y-2">
                    {exercises.map((we, index) => (
                      <li key={we.id} className="text-sm flex items-start gap-2">
                        <Badge variant="outline" className="font-mono text-xs mt-0.5">
                          {index + 1}
                        </Badge>
                        <span className="flex-1">{we.exercise.libelle}</span>
                      </li>
                    ))}
                  </ul>
                  {isCircuitWorkout && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Circuit de {session.workout.circuit_rounds} tours
                    </p>
                  )}
                </div>
              )}

              <div className="text-center">
                <Button onClick={startSession} size="lg" className="bg-gradient-primary">
                  <Clock className="h-4 w-4 mr-2" />
                  Démarrer la séance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercises - Mode Circuit ou Classique */}
        {sessionStarted &&
          exercises.length > 0 &&
          (isCircuitWorkout ? (
            <CircuitTrainingView
              exercises={exercises}
              circuitRounds={session.workout.circuit_rounds || 3}
              restTime={session.workout.temps_repos_tours_seconds || 60}
              sessionId={session.id}
              nombreCircuits={session.workout.nombre_circuits || 1}
              circuitConfigs={session.workout.circuit_configs || undefined}
              onRoundComplete={handleRoundComplete}
              onAllComplete={handleCircuitComplete}
            />
          ) : (
            <div className="space-y-6">
              {exercises.map((workoutExercise, index) => (
                <ExerciseCard
                  key={workoutExercise.id}
                  exercise={workoutExercise.exercise}
                  workoutExercise={workoutExercise}
                  sessionId={session.id}
                  onSetComplete={() => {}}
                  onFeedback={(feedback) => {
                    handleExerciseComplete(workoutExercise.exercise.id);
                  }}
                />
              ))}
            </div>
          ))}

        {/* Complete Session */}
        {sessionStarted && sessionCompleted && canComplete && (
          <SessionCompleteCard 
            sessionId={session.id}
            coachPhoneNumber={coachPhone}
            commentaireFin={commentaireFin}
            onCommentChange={setCommentaireFin}
          />
        )}

        {/* WhatsApp Link */}
        {(sessionCompleted || session.statut === "done") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partage ton feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Envoie une preuve de séance à ton coach et partage ton feedback !</p>
              <Button
                onClick={() => {
                  const message = encodeURIComponent(
                    "Voici ma preuve de séance et mon feedback :\n\n[Ajoute ici ta photo ou vidéo et ton ressenti sur la séance]",
                  );
                  window.open(`https://wa.me/?text=${message}`, "_blank");
                }}
                className="w-full bg-gradient-primary"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter mon coach sur WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Exercises */}
        {exercises.length === 0 && sessionStarted && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Aucun exercice programmé</h3>
              <p className="text-sm text-muted-foreground">Cette séance ne contient pas encore d'exercices.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientSession;
