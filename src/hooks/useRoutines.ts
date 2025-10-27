import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RoutineExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  repetitions: number | null;
  exercise: {
    id: string;
    libelle: string;
    description: string | null;
    video_id: string | null;
    video_provider: string;
    youtube_url: string | null;
  };
}

export interface Routine {
  id: string;
  title: string;
  description: string | null;
  type: 'exercises' | 'video';
  video_url: string | null;
  tips: string[];
  exercises?: RoutineExercise[];
  tracking?: {
    date: string;
    completed: boolean;
  }[];
}

export const useRoutines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutines = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch assigned routines for client
      const { data: assignedRoutines, error: assignError } = await supabase
        .from('client_routines')
        .select('routine_id')
        .eq('client_id', user.id)
        .eq('active', true);

      if (assignError) throw assignError;

      const routineIds = assignedRoutines?.map(ar => ar.routine_id) || [];

      if (routineIds.length === 0) {
        setRoutines([]);
        return;
      }

      // Fetch routines details
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .in('id', routineIds);

      if (routinesError) throw routinesError;

      // Fetch exercises for exercise-type routines
      const exerciseRoutineIds = routinesData
        ?.filter(r => r.type === 'exercises')
        .map(r => r.id) || [];

      let exercisesMap: Record<string, RoutineExercise[]> = {};

      if (exerciseRoutineIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('routine_exercises')
          .select('*, exercise:exercise_id(*)')
          .in('routine_id', exerciseRoutineIds)
          .order('order_index');

        if (exercisesError) throw exercisesError;

        exercisesData?.forEach(ex => {
          if (!exercisesMap[ex.routine_id]) {
            exercisesMap[ex.routine_id] = [];
          }
          exercisesMap[ex.routine_id].push(ex as any);
        });
      }

      // Fetch tracking data for current week
      const weekDates = getCurrentWeekDates();
      const { data: trackingData } = await supabase
        .from('routine_tracking')
        .select('*')
        .eq('client_id', user.id)
        .in('routine_id', routineIds)
        .in('date', weekDates);

      const trackingMap: Record<string, any[]> = {};
      trackingData?.forEach(track => {
        if (!trackingMap[track.routine_id]) {
          trackingMap[track.routine_id] = [];
        }
        trackingMap[track.routine_id].push({
          date: track.date,
          completed: track.completed
        });
      });

      const formattedRoutines: Routine[] = routinesData?.map(routine => ({
        id: routine.id,
        title: routine.title,
        description: routine.description,
        type: routine.type,
        video_url: routine.video_url,
        tips: Array.isArray(routine.tips) ? routine.tips as string[] : [],
        exercises: exercisesMap[routine.id] || [],
        tracking: trackingMap[routine.id] || []
      })) || [];

      setRoutines(formattedRoutines);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des routines');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutineCheck = async (routineId: string, date: string) => {
    if (!user) return;

    try {
      // Check if tracking exists
      const { data: existing } = await supabase
        .from('routine_tracking')
        .select('*')
        .eq('client_id', user.id)
        .eq('routine_id', routineId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('routine_tracking')
          .update({ completed: !existing.completed })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('routine_tracking')
          .insert({
            client_id: user.id,
            routine_id: routineId,
            date,
            completed: true
          });

        if (error) throw error;
      }

      // Refresh data
      await fetchRoutines();
    } catch (err: any) {
      console.error('Error toggling routine check:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, [user]);

  return {
    routines,
    loading,
    error,
    toggleRoutineCheck,
    refetch: fetchRoutines
  };
};

const getCurrentWeekDates = (): string[] => {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};
