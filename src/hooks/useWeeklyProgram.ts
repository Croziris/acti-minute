import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WeeklySession {
  id: string;
  index_num: number;
  statut: 'planned' | 'ongoing' | 'done' | 'skipped';
  workout?: {
    id: string;
    titre: string;
    duree_estimee?: number;
  };
  date_demarree?: string;
  date_terminee?: string;
}

export interface WeekPlan {
  id: string;
  iso_week: number;
  start_date: string;
  end_date: string;
  expected_sessions: number;
  sessions: WeeklySession[];
}

export const useWeeklyProgram = () => {
  const { user } = useAuth();
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchWeeklyProgram = async () => {
      try {
        // Get current ISO week
        const now = new Date();
        const currentISOWeek = getISOWeek(now);
        
        // First try to get existing week plan
        const { data: weekPlanData, error: weekError } = await supabase
          .from('week_plan')
          .select(`
            *,
            program:program_id (
              client_id
            )
          `)
          .eq('iso_week', currentISOWeek)
          .eq('program.client_id', user.id)
          .single();

        if (weekError && weekError.code !== 'PGRST116') {
          throw weekError;
        }

        if (!weekPlanData) {
          // No week plan found, create placeholder
          setWeekPlan({
            id: '',
            iso_week: currentISOWeek,
            start_date: getWeekStart(now).toISOString().split('T')[0],
            end_date: getWeekEnd(now).toISOString().split('T')[0],
            expected_sessions: 3,
            sessions: []
          });
          setLoading(false);
          return;
        }

        // Get sessions for this week plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('session')
          .select(`
            id,
            index_num,
            statut,
            date_demarree,
            date_terminee,
            workout:workout_id (
              id,
              titre,
              duree_estimee
            )
          `)
          .eq('client_id', user.id)
          .eq('week_plan_id', weekPlanData.id)
          .order('index_num');

        if (sessionsError) throw sessionsError;

        setWeekPlan({
          ...weekPlanData,
          sessions: (sessionsData || []) as WeeklySession[]
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyProgram();
  }, [user]);

  return { weekPlan, loading, error, refetch: () => setLoading(true) };
};

// Helper functions for ISO week calculations
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

function getWeekEnd(date: Date): Date {
  const result = getWeekStart(date);
  result.setDate(result.getDate() + 6);
  return result;
}