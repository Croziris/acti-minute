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
      couleur?: string;
      tips?: string;
      variations?: string;
      order_index?: number;
      circuit_number?: number;
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
        couleur?: string;
        tips?: string;
        variations?: string;
        order_index?: number;
        circuit_number?: number;
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
        const { data: sessionData, error: sessionError } = await supabase
          .from('session')
          .select('*')
          .eq('id', sessionId)
          .eq('client_id', user.id)
          .single();

        if (sessionError) throw sessionError;

        // Charger les workouts via session_workout (sessions combinées)
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

        console.log('📥 Résultat requête session_workout:', sessionWorkouts);

        if (sessionWorkoutsError) {
          console.error('❌ Erreur:', sessionWorkoutsError);
          throw sessionWorkoutsError;
        }

        if (sessionWorkouts && sessionWorkouts.length > 0) {
          console.log(`✅ ${sessionWorkouts.length} workout(s) chargé(s)`);
          
          // Vérifier que chaque workout a ses exercices
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
          
          setLoading(false);
          return;
        } else if (sessionData.workout_id) {
          // Fallback: ancien système avec workout_id direct
          console.log('📋 Session simple (legacy) détectée - workout_id:', sessionData.workout_id);
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

          const combinedData: Session = {
            ...sessionData,
            statut: sessionData.statut as Session['statut'],
            workout: {
              ...workoutData,
              session_type: workoutData.session_type as 'warmup' | 'main' | 'cooldown' | undefined,
              circuit_configs: workoutData.circuit_configs as Array<{ rounds: number; rest: number }> | undefined,
              workout_exercise: workoutExerciseData || []
            }
          };

          console.log('✅ Session simple chargée:', {
            workout_titre: workoutData.titre,
            nb_exercices: workoutExerciseData?.length || 0
          });

          setSession(combinedData);
        } else {
          setSession({
            ...sessionData,
            statut: sessionData.statut as Session['statut']
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user]);

  return { session, loading, error, refetch: () => setLoading(true) };
};
