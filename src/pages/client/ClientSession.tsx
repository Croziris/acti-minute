import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseCard } from "@/components/session/ExerciseCard";
import { CircuitTrainingView } from "@/components/client/CircuitTrainingView";
import { SessionCompleteCard } from "@/components/session/SessionCompleteCard";
import { Textarea } from "@/components/ui/textarea";
import { SessionFeedbackModal } from "@/components/session/SessionFeedbackModal";
import { useSessionData } from "@/hooks/useSessionData";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, ArrowLeft, MessageCircle, Trophy, Layers } from "lucide-react";

const ClientSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, loading, error } = useSessionData(sessionId);
  const { addOfflineData, isOnline } = useOfflineSync();
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [commentaireFin, setCommentaireFin] = useState("");
  const [coachPhone, setCoachPhone] = useState<string>('');
  const [showValidationScreen, setShowValidationScreen] = useState(false);
  const [showContactScreen, setShowContactScreen] = useState(false);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);

  // Variables dérivées - supporter sessions combinées et simples
  const isCombinedSession = session?.session_workout && session.session_workout.length > 0;

  // Récupérer les workouts dans l'ordre avec vérification de sécurité
  const orderedWorkouts = React.useMemo(() => {
    if (!session) {
      console.log('⚠️ Session null');
      return [];
    }
    
    if (isCombinedSession) {
      // Session combinée : trier par order_index et extraire les workouts
      const workouts = session.session_workout
        .filter(sw => sw?.workout !== null && sw?.workout !== undefined) // ✅ Double vérification
        .sort((a, b) => a.order_index - b.order_index)
        .map(sw => sw.workout);
      
      console.log('🔹 Workouts combinés filtrés:', workouts.length, '/', session.session_workout.length);
      return workouts;
    } else if (session.workout) {
      // Session simple : 1 seul workout
      console.log('🔹 Workout simple détecté');
      return [session.workout];
    }
    
    console.log('⚠️ Aucun workout trouvé');
    return [];
  }, [session, isCombinedSession]);

  // Workout actuel (avec vérification de sécurité)
  const currentWorkout = orderedWorkouts.length > 0 ? orderedWorkouts[currentWorkoutIndex] : null;
  const exercises = currentWorkout?.workout_exercise || [];
  const isCircuitWorkout = currentWorkout?.workout_type === "circuit";

  // Log pour débugger
  useEffect(() => {
    console.log('🔍 État session:', {
      session_id: session?.id,
      isCombined: isCombinedSession,
      nb_workouts: orderedWorkouts.length,
      currentIndex: currentWorkoutIndex,
      currentWorkout: currentWorkout ? {
        id: currentWorkout.id,
        titre: currentWorkout.titre,
        type: currentWorkout.workout_type,
        session_type: currentWorkout.session_type,
        nb_exercices: exercises.length
      } : null
    });
  }, [session, orderedWorkouts, currentWorkoutIndex, currentWorkout, exercises, isCombinedSession]);

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
  useEffect(() => {
    async function loadClassicProgress() {
      if (!session || !session.workout) return;
      
      const isCircuitWorkout = session.workout?.workout_type === "circuit";
      if (isCircuitWorkout || !sessionStarted) return;
      
      try {
        const { data, error } = await supabase
          .from('classic_session_progress')
          .select('completed_exercises')
          .eq('session_id', session.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.completed_exercises) {
          const completedIds = data.completed_exercises as string[];
          console.log("📂 Progression classique restaurée:", completedIds);
          
          setCompletedExercises(new Set(completedIds));
          
          const exercises = session.workout?.workout_exercise || [];
          if (completedIds.length > 0) {
            toast({
              title: "🔄 Progression restaurée",
              description: `${completedIds.length}/${exercises.length} exercice${completedIds.length > 1 ? 's' : ''} déjà effectué${completedIds.length > 1 ? 's' : ''}`,
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement progression classique:', error);
      }
    }

    if (session && sessionStarted) {
      loadClassicProgress();
    }
  }, [session?.id, sessionStarted]);

  // Détecter automatiquement la fin de séance CLASSIQUE
  useEffect(() => {
    if (!session || !session.workout) return;
    
    const exercises = session.workout?.workout_exercise || [];
    const isCircuitWorkout = session.workout?.workout_type === "circuit";
    
    if (!isCircuitWorkout && 
        sessionStarted && 
        !showValidationScreen && 
        !showFinalFeedback &&
        completedExercises.size === exercises.length && 
        exercises.length > 0) {
      
      console.log("🎯 Détection fin de séance classique - tous les exercices complétés");
      setShowFinalFeedback(true);
    }
  }, [session, completedExercises, sessionStarted, showValidationScreen, showFinalFeedback]);

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

  const validateSession = async () => {
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
        
        // Supprimer la progression sauvegardée (circuits + classique)
        const isCircuitWorkout = session.workout?.workout_type === "circuit";
        
        if (isCircuitWorkout) {
          await supabase
            .from('circuit_progress')
            .delete()
            .eq('session_id', session.id);
          console.log("🗑️ Progression circuit supprimée");
        } else {
          await supabase
            .from('classic_session_progress')
            .delete()
            .eq('session_id', session.id);
          console.log("🗑️ Progression classique supprimée");
        }
      } else {
        addOfflineData("session_update", {
          sessionId: session.id,
          updates: updateData,
        });
      }

      setSessionCompleted(true);
      setShowContactScreen(true);

      toast({
        title: "✅ Séance validée !",
        description: "Félicitations pour cette séance !",
      });
    } catch (error) {
      console.error("Error validating session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la séance",
        variant: "destructive",
      });
    }
  };

  const handleGoToHistory = () => {
    navigate('/client/home');
  };

  const handleWhatsAppContact = () => {
    const message = commentaireFin 
      ? `Séance terminée ! 💪\n\nMes ressentis :\n${commentaireFin}`
      : 'Séance terminée ! Je voulais te partager mes ressentis.';
    
    const whatsappUrl = coachPhone 
      ? `https://wa.me/${coachPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleExerciseComplete = async (exerciseId: string) => {
    const newCompleted = new Set(completedExercises).add(exerciseId);
    setCompletedExercises(newCompleted);
    
    // Sauvegarder automatiquement pour les séances classiques
    const isCircuit = session?.workout?.workout_type === "circuit";
    if (!isCircuit && session) {
      await saveClassicProgress(Array.from(newCompleted));
    }
    
    console.log(`✅ Exercice ${exerciseId} marqué comme complété`);
  };

  const saveClassicProgress = async (completedExerciseIds: string[]) => {
    if (!session) return;
    
    const isCircuit = session.workout?.workout_type === "circuit";
    if (isCircuit) return;
    
    try {
      const { error } = await supabase
        .from('classic_session_progress')
        .upsert({
          session_id: session.id,
          completed_exercises: completedExerciseIds,
        }, {
          onConflict: 'session_id'
        });

      if (error) throw error;
      
      const exercises = session.workout?.workout_exercise || [];
      console.log(`✅ Progression classique sauvegardée: ${completedExerciseIds.length}/${exercises.length} exercices`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde progression classique:', error);
    }
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
    console.log("🎉 Circuit workout terminé");
    completeCurrentWorkout();
  };

  const completeCurrentWorkout = () => {
    if (!currentWorkout) {
      console.error('❌ Impossible de compléter : currentWorkout est null');
      toast({
        title: "Erreur",
        description: "Impossible de terminer ce workout",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`✅ Workout ${currentWorkoutIndex + 1}/${orderedWorkouts.length} terminé: ${currentWorkout.titre}`);
    
    setCompletedWorkouts(prev => new Set(prev).add(currentWorkoutIndex));
    setCompletedExercises(new Set()); // Reset pour le prochain workout
    
    if (currentWorkoutIndex < orderedWorkouts.length - 1) {
      // Il y a encore des workouts à faire
      const nextIndex = currentWorkoutIndex + 1;
      const nextWorkout = orderedWorkouts[nextIndex];
      
      if (!nextWorkout) {
        console.error('❌ Workout suivant introuvable à l\'index', nextIndex);
        toast({
          title: "Erreur",
          description: "Impossible de charger le workout suivant",
          variant: "destructive"
        });
        return;
      }
      
      setCurrentWorkoutIndex(nextIndex);
      
      toast({
        title: `Séance ${nextIndex + 1}/${orderedWorkouts.length}`,
        description: `Passons à : ${nextWorkout.titre} 💪`,
      });
    } else {
      // Tous les workouts sont terminés
      handleAllWorkoutsComplete();
    }
  };

  const handleAllWorkoutsComplete = () => {
    console.log("🎉 Tous les workouts terminés");
    const allExerciseIds = exercises.map((e) => e.exercise.id);
    setCompletedExercises(new Set(allExerciseIds));
    setShowFinalFeedback(true);
  };

  const handleFinalFeedbackSubmit = async (feedback: {
    rpe: number;
    difficulte: number;
    plaisir: number;
    commentaire?: string;
  }) => {
    if (!session || !user) return;

    try {
      // Enregistrer le feedback final en DB
      const { error } = await supabase.from('exercise_feedback').insert({
        session_id: session.id,
        exercise_id: null, // null = feedback global de séance
        difficulte_0_10: feedback.difficulte,
        plaisir_0_10: feedback.plaisir,
        feedback_type: 'session',
        rpe: feedback.rpe,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      console.log("✅ Feedback final enregistré");
      
      // Fermer le modal
      setShowFinalFeedback(false);
      
      // Sauvegarder le commentaire pour l'écran suivant
      setCommentaireFin(feedback.commentaire || '');
      
      // Passer à l'écran de félicitations
      setShowValidationScreen(true);
    } catch (error) {
      console.error('Error submitting final feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le feedback",
        variant: "destructive",
      });
    }
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
        {/* Modal de feedback final (commun circuits + classiques) */}
        <SessionFeedbackModal
          open={showFinalFeedback}
          onOpenChange={setShowFinalFeedback}
          onSubmit={handleFinalFeedbackSubmit}
        />

        {/* ÉCRAN 1 : VALIDATION DE LA SÉANCE (après feedback final) */}
        {showValidationScreen && !showContactScreen ? (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-green-500/20 rounded-full">
                  <Trophy className="h-20 w-20 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold text-green-900 dark:text-green-100">
                🎉 Félicitations !
              </CardTitle>
              <p className="text-green-700 dark:text-green-300 mt-3 text-xl">
                Tu as terminé tous les circuits !
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Résumé de la séance */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  📊 Résumé de ta séance
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ {session.workout.nombre_circuits || 1} circuit{(session.workout.nombre_circuits || 1) > 1 ? 's' : ''} complété{(session.workout.nombre_circuits || 1) > 1 ? 's' : ''}</p>
                  <p>✅ {totalRounds} tours effectués</p>
                  <p>✅ {exercises.length} exercices réalisés</p>
                </div>
              </div>

              {/* Zone de commentaire optionnel */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-green-900 dark:text-green-100">
                  💬 Commentaire (optionnel)
                </label>
                <Textarea
                  placeholder="Comment t'es-tu senti ? Des remarques pour ton coach ?"
                  value={commentaireFin}
                  onChange={(e) => setCommentaireFin(e.target.value)}
                  className="min-h-[100px] bg-white dark:bg-gray-900 border-green-200 dark:border-green-800"
                  rows={4}
                />
              </div>

              {/* Bouton de validation OBLIGATOIRE */}
              <Button
                onClick={validateSession}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Valider ma séance
              </Button>

              {/* Message d'info */}
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-center text-green-700 dark:text-green-400">
                  ⚠️ Valide ta séance pour sauvegarder tes performances
                </p>
              </div>
            </CardContent>
          </Card>
        )
        
        /* ÉCRAN 2 : CONTACT COACH (après validation) */
        : showContactScreen ? (
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-500/20 rounded-full">
                  <MessageCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ✅ Séance enregistrée !
              </CardTitle>
              <p className="text-blue-700 dark:text-blue-300 mt-2">
                N'hésite pas à partager tes ressentis avec ton coach
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Bouton WhatsApp */}
              <Button
                onClick={handleWhatsAppContact}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white h-14"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Envoyer un message WhatsApp à mon coach
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-blue-50 dark:bg-blue-950/20 px-2 text-muted-foreground">
                    ou
                  </span>
                </div>
              </div>

              {/* Bouton vers historique */}
              <Button
                onClick={handleGoToHistory}
                size="lg"
                variant="outline"
                className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 h-14"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        )
        
        /* ÉCRAN 3 : SÉANCE EN COURS (état par défaut) */
        : (
          <>
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
                <h1 className="text-2xl font-bold">
                  {orderedWorkouts.length > 1 
                    ? `Session combinée (${orderedWorkouts.length} séances)`
                    : currentWorkout?.titre || `Séance ${session.index_num}`
                  }
                </h1>
                {orderedWorkouts.length === 1 && currentWorkout?.description && (
                  <p className="text-muted-foreground mt-1">{currentWorkout.description}</p>
                )}
              </div>
            </div>

            {orderedWorkouts.length > 1 && sessionStarted && (
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-purple-500 sticky top-20 z-10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold">Session combinée ({orderedWorkouts.length} séances)</h3>
                  </div>
                  <div className="space-y-2">
                    {orderedWorkouts
                      .filter(w => w !== null && w !== undefined)
                      .map((workout, index) => (
                        <div 
                          key={`overview-${workout.id || index}`}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            index === currentWorkoutIndex 
                              ? 'bg-purple-600 text-white shadow-lg scale-105' 
                              : completedWorkouts.has(index)
                                ? 'bg-green-100 dark:bg-green-900/30 opacity-75' 
                                : 'bg-white dark:bg-gray-800 opacity-60'
                          }`}
                        >
                          <Badge 
                            variant={index === currentWorkoutIndex ? 'default' : 'outline'} 
                            className={`font-mono ${index === currentWorkoutIndex ? 'bg-white text-purple-600' : ''}`}
                          >
                            {index + 1}
                          </Badge>
                          <span className="text-xl">
                            {workout?.session_type === 'warmup' && '🔥'}
                            {workout?.session_type === 'main' && '💪'}
                            {workout?.session_type === 'cooldown' && '🧘'}
                            {!workout?.session_type && '📋'}
                          </span>
                          <span className={`font-medium flex-1 ${index === currentWorkoutIndex ? 'font-bold' : ''}`}>
                            {workout?.titre || 'Séance sans titre'}
                          </span>
                        {completedWorkouts.has(index) && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {index === currentWorkoutIndex && (
                          <Badge variant="default" className="bg-white text-purple-600">
                            En cours
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress - Affichage différent pour circuits */}
            {exercises.length > 0 && !isCircuitWorkout && sessionStarted && (
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
            {!sessionStarted && session.statut === "planned" && currentWorkout && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Prêt à commencer ?</h3>
                    {orderedWorkouts.length > 1 && (
                      <p className="text-muted-foreground mb-2">
                        Session combinée de {orderedWorkouts.length} séances
                      </p>
                    )}
                    <p className="text-muted-foreground mb-4">
                      {currentWorkout.duree_estimee && `Durée estimée: ${orderedWorkouts.filter(w => w).reduce((sum, w) => sum + (w.duree_estimee || 0), 0)} minutes`}
                    </p>
                  </div>

                   <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                      {orderedWorkouts.length > 1 ? (
                        <div className="space-y-4">
                          <p className="text-sm font-medium mb-3">
                            Session combinée de {orderedWorkouts.length} séances :
                          </p>
                          {orderedWorkouts
                            .filter(w => w !== null && w !== undefined)
                            .map((workout, wIdx) => {
                              const workoutExercises = workout?.workout_exercise || [];
                              return (
                                <Card key={`preview-${workout?.id || wIdx}`} className="border-l-4 border-l-purple-500">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {wIdx + 1}
                                      </Badge>
                                      <span className="text-xl">
                                        {workout?.session_type === 'warmup' && '🔥'}
                                        {workout?.session_type === 'main' && '💪'}
                                        {workout?.session_type === 'cooldown' && '🧘'}
                                        {!workout?.session_type && '📋'}
                                      </span>
                                      <CardTitle className="text-base">{workout?.titre || 'Séance sans titre'}</CardTitle>
                                  </div>
                                  {workout.duree_estimee && (
                                    <Badge variant="secondary" className="mt-1 w-fit">
                                      {workout.duree_estimee} min
                                    </Badge>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {workoutExercises.length} exercice{workoutExercises.length > 1 ? 's' : ''}
                                  </p>
                                  <ul className="space-y-1">
                                    {workoutExercises.slice(0, 3).map((we, idx) => (
                                      <li key={we.id} className="text-xs flex items-start gap-1">
                                        <span className="text-muted-foreground">•</span>
                                        <span className="flex-1">{we.exercise.libelle}</span>
                                      </li>
                                    ))}
                                    {workoutExercises.length > 3 && (
                                      <li className="text-xs text-muted-foreground italic">
                                        ... et {workoutExercises.length - 3} autres
                                      </li>
                                    )}
                                  </ul>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium mb-3">
                            Voici les exercices de ta séance :
                          </p>
                          <ul className="space-y-2">
                            {exercises.slice(0, 5).map((we, index) => (
                              <li key={we.id} className="text-sm flex items-start gap-2">
                                <Badge variant="outline" className="font-mono text-xs mt-0.5">
                                  {index + 1}
                                </Badge>
                                <span className="flex-1">{we.exercise.libelle}</span>
                              </li>
                            ))}
                            {exercises.length > 5 && (
                              <li className="text-xs text-muted-foreground italic">
                                ... et {exercises.length - 5} autres exercices
                              </li>
                            )}
                          </ul>
                          {isCircuitWorkout && (
                            <p className="text-xs text-muted-foreground mt-3 italic">
                              Circuit de {currentWorkout.circuit_rounds} tours
                            </p>
                          )}
                        </>
                      )}
                    </div>

                  <div className="text-center">
                    <Button onClick={startSession} size="lg" className="bg-gradient-primary">
                      <Clock className="h-4 w-4 mr-2" />
                      Démarrer la séance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guard : vérifier que la session et les workouts sont valides */}
            {sessionStarted && orderedWorkouts.length === 0 ? (
              // ❌ Cas d'erreur : session démarrée mais aucun workout
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <h2 className="text-xl font-semibold mb-2">Aucun exercice programmé</h2>
                  <p className="text-muted-foreground mb-4">
                    Cette séance ne contient pas encore d'exercices.
                  </p>
                  <Button onClick={() => navigate("/client/home")} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </CardContent>
              </Card>
            ) : sessionStarted && !currentWorkout ? (
              // ❌ Cas d'erreur : workout actuel introuvable
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
                  <p className="text-muted-foreground mb-4">
                    Impossible de charger le workout actuel (index: {currentWorkoutIndex}).
                  </p>
                  <Button 
                    onClick={() => {
                      console.log('🔧 Reset index à 0');
                      setCurrentWorkoutIndex(0);
                    }} 
                    variant="outline"
                    className="mr-2"
                  >
                    Réessayer
                  </Button>
                  <Button 
                    onClick={() => navigate("/client/home")} 
                    variant="ghost"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                </CardContent>
              </Card>
            ) : sessionStarted && currentWorkout && exercises.length === 0 ? (
              // ❌ Cas d'erreur : workout sans exercices
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Workout vide</h2>
                  <p className="text-muted-foreground mb-4">
                    Le workout "{currentWorkout.titre}" ne contient pas d'exercices.
                  </p>
                  {isCombinedSession && currentWorkoutIndex < orderedWorkouts.length - 1 ? (
                    <Button 
                      onClick={() => {
                        console.log('⏭️ Skip workout vide');
                        setCurrentWorkoutIndex(prev => prev + 1);
                      }}
                    >
                      Passer au workout suivant
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/client/home")} variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour à l'accueil
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : sessionStarted && currentWorkout && exercises.length > 0 ? (
              // ✅ Tout est OK : afficher la séance
              <div className="space-y-4">
                {/* Header du workout actuel */}
                {orderedWorkouts.length > 1 && currentWorkout && (
                  <Card className={`border-2 ${
                    currentWorkout?.session_type === 'warmup' 
                      ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 border-orange-500'
                      : currentWorkout?.session_type === 'cooldown'
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 border-green-500'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 border-blue-500'
                  }`}>
                    <CardContent className="p-8 text-center">
                      <div className="text-5xl mb-3">
                        {currentWorkout?.session_type === 'warmup' && '🔥'}
                        {currentWorkout?.session_type === 'main' && '💪'}
                        {currentWorkout?.session_type === 'cooldown' && '🧘'}
                        {!currentWorkout?.session_type && '📋'}
                      </div>
                      
                      <Badge variant="outline" className="mb-2">
                        Séance {currentWorkoutIndex + 1}/{orderedWorkouts.length}
                      </Badge>
                      
                      <h2 className="text-3xl font-bold mb-2">{currentWorkout.titre}</h2>
                      
                      {currentWorkout.description && (
                        <p className="text-muted-foreground">{currentWorkout.description}</p>
                      )}
                      
                      {currentWorkout.duree_estimee && (
                        <Badge variant="secondary" className="mt-3">
                          {currentWorkout.duree_estimee} minutes
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Exercices */}
                {isCircuitWorkout ? (
                  <CircuitTrainingView
                    exercises={exercises}
                    circuitRounds={currentWorkout.circuit_rounds || 3}
                    restTime={currentWorkout.temps_repos_tours_seconds || 60}
                    sessionId={session.id}
                    nombreCircuits={currentWorkout.nombre_circuits || 1}
                    circuitConfigs={currentWorkout.circuit_configs || undefined}
                    onRoundComplete={handleRoundComplete}
                    onAllComplete={handleCircuitComplete}
                  />
                ) : (
                  <>
                    {exercises.map((workoutExercise) => (
                      <ExerciseCard
                        key={workoutExercise.id}
                        exercise={workoutExercise.exercise}
                        workoutExercise={workoutExercise}
                        sessionId={session.id}
                        onSetComplete={() => {}}
                        onFeedback={
                          currentWorkout && ['warmup', 'cooldown'].includes(currentWorkout.session_type || '')
                            ? null
                            : (feedback) => handleExerciseComplete(workoutExercise.exercise.id)
                        }
                        showFeedback={currentWorkout ? !['warmup', 'cooldown'].includes(currentWorkout.session_type || '') : true}
                      />
                    ))}

                    {/* Bouton de fin de workout pour séances classiques */}
                    {(orderedWorkouts.length > 1 || (orderedWorkouts.length === 1 && !isCircuitWorkout)) && (
                      <Card className="sticky bottom-4 bg-gradient-to-r from-primary/10 to-primary/5 shadow-xl">
                        <CardContent className="p-6">
                          <Button 
                            onClick={completeCurrentWorkout} 
                            size="lg" 
                            className="w-full h-16 text-xl"
                          >
                            <CheckCircle className="h-6 w-6 mr-3" />
                            {currentWorkoutIndex < orderedWorkouts.length - 1 
                              ? `Terminer "${currentWorkout.titre}" et continuer`
                              : `Terminer "${currentWorkout.titre}"`
                            }
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientSession;
