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
      section?: 'warmup' | 'main' | 'cooldown';
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
        // First get the session
        const { data: sessionData, error: sessionError } = await supabase
          .from('session')
          .select('*')
          .eq('id', sessionId)
          .eq('client_id', user.id)
          .single();

        if (sessionError) throw sessionError;

        // Then get the workout with exercises if workout_id exists
        if (sessionData.workout_id) {
          const { data: workoutData, error: workoutError } = await supabase
            .from('workout')
            .select(`
              id,
              titre,
              description,
              duree_estimee,
              workout_type,
              circuit_rounds,
              temps_repos_tours_seconds,
              nombre_circuits,
              circuit_configs
            `)
            .eq('id', sessionData.workout_id)
            .single();

          if (workoutError) throw workoutError;

          // Get workout exercises
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
              circuit_configs: workoutData.circuit_configs as Array<{ rounds: number; rest: number }> | undefined,
              workout_exercise: (workoutExerciseData || []).map(we => ({
                ...we,
                section: (we.section || 'main') as 'warmup' | 'main' | 'cooldown'
              }))
            }
          };

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