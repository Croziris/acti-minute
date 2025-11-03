// REMPLACE TOUT LE CONTENU DE src/hooks/useSessionData.ts PAR :

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Session {
  id: string;
  client_id: string;
  week_plan_id?: string;
  workout_id?: string;
  index_num?: number;
  date_demarree?: string;
  date_terminee?: string;
  statut: 'planned' | 'ongoing' | 'done' | 'skipped';
  proof_media_url?: string;
  workout?: {
    id: string;
    titre: string;
    description?: string;
    duree_estimee?: number;
    workout_type?: string;
    session_type?: 'warmup' | 'main' | 'cooldown';
    circuit_rounds?: number;
    temps_repos_tours_seconds?: number;
    nombre_circuits?: number;
    circuit_configs?: Array<{ rounds: number; rest: number }>;
    workout_exercise: Array<{
      id: string;
      exercise_id: string;
      series?: number;
      reps?: number;
      temps_seconds?: number;
      charge_cible?: number;
      tempo?: string;
      couleur_elastique?: string;
      tips?: string;
      variations?: string;
      order_index?: number;
      circuit_number?: number;
      section?: string;
      rpe_cible?: number;
      temps_repos_seconds?: number;
      exercise: {
        id: string;
        libelle: string;
        description?: string;
        video_id?: string;
        youtube_url?: string;
        categories: string[];
        groupes: string[];
      };
    }>;
  };
  session_workout?: Array<{
    order_index: number;
    workout: {
      id: string;
      titre: string;
      description?: string;
      duree_estimee?: number;
      workout_type?: string;
      session_type?: 'warmup' | 'main' | 'cooldown';
      circuit_rounds?: number;
      temps_repos_tours_seconds?: number;
      nombre_circuits?: number;
      circuit_configs?: Array<{ rounds: number; rest: number }>;
      workout_exercise: Array<{
        id: string;
        exercise_id: string;
        series?: number;
        reps?: number;
        temps_seconds?: number;
        charge_cible?: number;
        tempo?: string;
        couleur_elastique?: string;
        tips?: string;
        variations?: string;
        order_index?: number;
        circuit_number?: number;
        section?: string;
        rpe_cible?: number;
        temps_repos_seconds?: number;
        exercise: {
          id: string;
          libelle: string;
          description?: string;
          video_id?: string;
          youtube_url?: string;
          categories: string[];
          groupes: string[];
        };
      }>;
    };
  }>;
}

export const useSessionData = (sessionId?: string) => {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Charger la session de base
        const { data: sessionData, error: sessionError } = await supabase
          .from('session')
          .select('*')
          .eq('id', sessionId)
          .eq('client_id', user.id)
          .single();

        if (sessionError) throw sessionError;

        console.log('📦 Session chargée:', sessionData);

        // 2. Essayer de charger via session_workout (sessions combinées)
        const { data: sessionWorkouts, error: sessionWorkoutsError } = await supabase
          .from('session_workout')
          .select(`
            order_index,
            workout (
              id,
              titre,
              description,
              duree_estimee,
              workout_type,
              session_type,
              circuit_rounds,
              temps_repos_tours_seconds,
              nombre_circuits,
              circuit_configs,
              workout_exercise (
                id,
                exercise_id,
                series,
                reps,
                temps_seconds,
                charge_cible,
                tempo,
                couleur_elastique,
                tips,
                variations,
                order_index,
                circuit_number,
                section,
                rpe_cible,
                temps_repos_seconds,
                exercise (
                  id,
                  libelle,
                  description,
                  video_id,
                  youtube_url,
                  categories,
                  groupes
                )
              )
            )
          `)
          .eq('session_id', sessionId)
          .order('order_index');

        if (sessionWorkoutsError) {
          console.error('❌ Erreur session_workout:', sessionWorkoutsError);
        }

        // 3. ✅ PRIORITÉ À workout_id DIRECT (sessions simples)
        if (sessionData.workout_id) {
          // SESSION SIMPLE (priorité absolue)
          console.log('📋 Session simple - workout_id:', sessionData.workout_id);
          
          const { data: workoutData, error: workoutError } = await supabase
            .from('workout')
            .select(`
              id,
              titre,
              description,
              duree_estimee,
              workout_type,
              session_type,
              circuit_rounds,
              temps_repos_tours_seconds,
              nombre_circuits,
              circuit_configs
            `)
            .eq('id', sessionData.workout_id)
            .single();

          if (workoutError) throw workoutError;

          const { data: workoutExerciseData, error: workoutExerciseError } = await supabase
            .from('workout_exercise')
            .select(`
              *,
              exercise:exercise_id (
                id,
                libelle,
                description,
                video_id,
                youtube_url,
                categories,
                groupes
              )
            `)
            .eq('workout_id', sessionData.workout_id)
            .order('order_index');

          if (workoutExerciseError) throw workoutExerciseError;

          console.log('✅ Session simple chargée:', {
            workout_titre: workoutData.titre,
            nb_exercices: workoutExerciseData?.length || 0
          });

          setSession({
            ...sessionData,
            statut: sessionData.statut as Session['statut'],
            workout: {
              ...workoutData,
              session_type: workoutData.session_type as 'warmup' | 'main' | 'cooldown' | undefined,
              circuit_configs: workoutData.circuit_configs as Array<{ rounds: number; rest: number }> | undefined,
              workout_exercise: workoutExerciseData || []
            }
          });
          
        } else if (sessionWorkouts && sessionWorkouts.length > 0) {
          // SESSION COMBINÉE (seulement si workout_id est NULL)
          console.log(`✅ Session combinée: ${sessionWorkouts.length} workout(s)`);
          
          sessionWorkouts.forEach((sw, idx) => {
            console.log(`  Workout ${idx + 1}:`, {
              id: sw.workout?.id,
              titre: sw.workout?.titre,
              nb_exercices: sw.workout?.workout_exercise?.length || 0
            });
          });

          setSession({
            ...sessionData,
            statut: sessionData.statut as Session['statut'],
            session_workout: sessionWorkouts.map((sw: any) => ({
              order_index: sw.order_index,
              workout: {
                ...sw.workout,
                session_type: sw.workout.session_type as 'warmup' | 'main' | 'cooldown' | undefined,
                circuit_configs: sw.workout.circuit_configs as Array<{ rounds: number; rest: number }> | undefined
              }
            }))
          });
          
        } else {
          // SESSION VIDE
          console.warn('⚠️ Session sans workout');
          setSession({
            ...sessionData,
            statut: sessionData.statut as Session['statut']
          });
        }
      } catch (err) {
        console.error('❌ Erreur fetchSession:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user]);

  return { session, loading, error };
};