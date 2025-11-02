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
import { CheckCircle, Clock, AlertCircle, ArrowLeft, MessageCircle, Trophy } from "lucide-react";

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
  const [showValidationScreen, setShowValidationScreen] = useState(false);
  const [showContactScreen, setShowContactScreen] = useState(false);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [currentSection, setCurrentSection] = useState<'warmup' | 'main' | 'cooldown' | 'completed'>('warmup');
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [mainCompleted, setMainCompleted] = useState(false);

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

  // Restaurer la progression des séances classiques
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
    console.log("🎉 handleCircuitComplete appelé dans ClientSession");
    // Marquer tous les exercices comme complétés
    const allExerciseIds = exercises.map((e) => e.exercise.id);
    setCompletedExercises(new Set(allExerciseIds));
    
    // Afficher le modal de feedback final
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

  const completeWarmup = () => {
    console.log("✅ Échauffement terminé");
    setWarmupCompleted(true);
    setCurrentSection('main');
    
    toast({
      title: "Échauffement terminé !",
      description: "Passons au corps de séance 💪",
    });
  };

  const completeMain = () => {
    console.log("✅ Corps de séance terminé");
    setMainCompleted(true);
    
    // Si cooldown existe, proposer, sinon terminer
    if (exercisesBySection.cooldown.length > 0) {
      setCurrentSection('cooldown');
      toast({
        title: "Corps de séance terminé !",
        description: "Veux-tu faire le retour au calme ? 🧘",
      });
    } else {
      // Pas de cooldown → Feedback final
      if (isCircuitWorkout) {
        handleCircuitComplete();
      } else {
        setShowFinalFeedback(true);
      }
    }
  };

  const skipCooldown = () => {
    console.log("⏭️ Retour au calme ignoré");
    setCurrentSection('completed');
    
    // Déclencher la fin de séance
    if (isCircuitWorkout) {
      handleCircuitComplete();
    } else {
      setShowFinalFeedback(true);
    }
  };

  const completeCooldown = () => {
    console.log("✅ Retour au calme terminé");
    setCurrentSection('completed');
    
    toast({
      title: "Séance complète !",
      description: "Bravo, tu as tout fait ! 🎉",
    });
    
    // Déclencher la fin de séance
    if (isCircuitWorkout) {
      handleCircuitComplete();
    } else {
      setShowFinalFeedback(true);
    }
  };

  // Déterminer la section de départ
  useEffect(() => {
    if (sessionStarted && exercises.length > 0 && currentSection === 'warmup') {
      // Déterminer par quelle section commencer
      if (exercisesBySection.warmup.length > 0) {
        setCurrentSection('warmup');
      } else if (exercisesBySection.main.length > 0) {
        setCurrentSection('main');
      } else if (exercisesBySection.cooldown.length > 0) {
        setCurrentSection('cooldown');
      }
    }
  }, [sessionStarted, exercises.length, exercisesBySection, currentSection]);

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

            {/* Exercises - Par section (warmup/main/cooldown) */}
            {sessionStarted && exercises.length > 0 && (
              <div className="space-y-6">
                {/* ══════════════════════════════════════════
                    SECTION 1 : ÉCHAUFFEMENT
                    ══════════════════════════════════════════ */}
                {currentSection === 'warmup' && exercisesBySection.warmup.length > 0 && (
                  <div className="space-y-4">
                    {/* Header échauffement */}
                    <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-500">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-2">🔥</div>
                        <h2 className="text-2xl font-bold mb-2">Échauffement</h2>
                        <p className="text-muted-foreground">
                          Prépare ton corps avant l'effort principal
                        </p>
                        <Badge variant="outline" className="mt-3">
                          {exercisesBySection.warmup.length} exercice{exercisesBySection.warmup.length > 1 ? 's' : ''}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Exercices d'échauffement */}
                    {exercisesBySection.warmup.map((workoutExercise) => (
                      <ExerciseCard
                        key={workoutExercise.id}
                        exercise={workoutExercise.exercise}
                        workoutExercise={workoutExercise}
                        sessionId={session.id}
                        onSetComplete={() => {}}
                        onFeedback={null}
                        showFeedback={false}
                      />
                    ))}

                    {/* Bouton pour passer au corps de séance */}
                    <Card className="sticky bottom-4 bg-gradient-to-r from-primary/10 to-primary/5">
                      <CardContent className="p-6">
                        <Button 
                          onClick={completeWarmup} 
                          size="lg" 
                          className="w-full h-14 text-lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Terminer l'échauffement et commencer la séance
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SECTION 2 : CORPS DE SÉANCE
                    ══════════════════════════════════════════ */}
                {currentSection === 'main' && exercisesBySection.main.length > 0 && (
                  <div className="space-y-4">
                    {/* Header corps de séance */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-500">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-2">💪</div>
                        <h2 className="text-2xl font-bold mb-2">Corps de séance</h2>
                        <p className="text-muted-foreground">
                          Effort principal - Donne tout ! 🔥
                        </p>
                      </CardContent>
                    </Card>

                    {/* Affichage selon le type (circuit ou classique) */}
                    {isCircuitWorkout ? (
                      <CircuitTrainingView
                        exercises={exercisesBySection.main}
                        circuitRounds={session.workout.circuit_rounds || 3}
                        restTime={session.workout.temps_repos_tours_seconds || 60}
                        sessionId={session.id}
                        nombreCircuits={session.workout.nombre_circuits || 1}
                        circuitConfigs={session.workout.circuit_configs || undefined}
                        onRoundComplete={handleRoundComplete}
                        onAllComplete={completeMain}
                      />
                    ) : (
                      <>
                        {exercisesBySection.main.map((workoutExercise) => (
                          <ExerciseCard
                            key={workoutExercise.id}
                            exercise={workoutExercise.exercise}
                            workoutExercise={workoutExercise}
                            sessionId={session.id}
                            onSetComplete={() => {}}
                            onFeedback={(feedback) => {
                              handleExerciseComplete(workoutExercise.exercise.id);
                            }}
                            showFeedback={true}
                          />
                        ))}
                        
                        {/* Bouton pour terminer le corps de séance */}
                        {completedExercises.size === exercisesBySection.main.length && exercisesBySection.main.length > 0 && (
                          <Card className="sticky bottom-4 bg-gradient-to-r from-primary/10 to-primary/5">
                            <CardContent className="p-6">
                              <Button 
                                onClick={completeMain} 
                                size="lg" 
                                className="w-full h-14 text-lg"
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Terminer le corps de séance
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SECTION 3 : RETOUR AU CALME (OPTIONNEL)
                    ══════════════════════════════════════════ */}
                {currentSection === 'cooldown' && exercisesBySection.cooldown.length > 0 && (
                  <div className="space-y-4">
                    {/* Header retour au calme */}
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-500">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-2">🧘</div>
                        <h2 className="text-2xl font-bold mb-2">Retour au calme</h2>
                        <p className="text-muted-foreground mb-3">
                          Récupération et étirements (optionnel)
                        </p>
                        <Badge variant="secondary">Optionnel</Badge>
                      </CardContent>
                    </Card>

                    {/* Exercices de retour au calme */}
                    {exercisesBySection.cooldown.map((workoutExercise) => (
                      <ExerciseCard
                        key={workoutExercise.id}
                        exercise={workoutExercise.exercise}
                        workoutExercise={workoutExercise}
                        sessionId={session.id}
                        onSetComplete={() => {}}
                        onFeedback={null}
                        showFeedback={false}
                      />
                    ))}

                    {/* Boutons : Terminer le cooldown OU Passer */}
                    <div className="sticky bottom-4 space-y-3">
                      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <CardContent className="p-6">
                          <Button 
                            onClick={completeCooldown} 
                            size="lg" 
                            className="w-full h-14 text-lg mb-3"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Terminer le retour au calme
                          </Button>
                          
                          <Button 
                            onClick={skipCooldown} 
                            size="lg" 
                            variant="outline"
                            className="w-full"
                          >
                            Passer cette étape
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
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
          </>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientSession;
