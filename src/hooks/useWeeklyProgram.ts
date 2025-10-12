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
        
        // First, get the client's program
        const { data: programData, error: programError } = await supabase
          .from('program')
          .select('id')
          .eq('client_id', user.id)
          .maybeSingle();

        if (programError) throw programError;

        if (!programData) {
          // No program found for this client
          setWeekPlan({
            id: '',
            iso_week: currentISOWeek,
            start_date: formatDateLocal(getWeekStart(now)),
            end_date: formatDateLocal(getWeekEnd(now)),
            expected_sessions: 0,
            sessions: []
          });
          setLoading(false);
          return;
        }

        // Get the week plan for CURRENT week only
        // We need to compare by start_date to handle year changes properly
        const weekStart = formatDateLocal(getWeekStart(now));
        const weekEnd = formatDateLocal(getWeekEnd(now));
        
        let { data: weekPlanData, error: weekError } = await supabase
          .from('week_plan')
          .select('*')
          .eq('program_id', programData.id)
          .eq('start_date', weekStart)
          .eq('end_date', weekEnd)
          .maybeSingle();

        if (weekError) throw weekError;

        if (!weekPlanData) {
          // No week plan found at all, create placeholder
          setWeekPlan({
            id: '',
            iso_week: currentISOWeek,
            start_date: formatDateLocal(getWeekStart(now)),
            end_date: formatDateLocal(getWeekEnd(now)),
            expected_sessions: 0,
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
        console.error('Error fetching weekly program:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyProgram();
  }, [user]);

  return { weekPlan, loading, error, refetch: () => setLoading(true) };
};

// Helper functions for ISO week calculations (French week: Monday to Sunday)
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

// Get Monday (start of week in French system)
function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
  const day = result.getDay();
  // For Sunday (0), go back 6 days to Monday
  // For Monday (1), stay on the same day
  // For other days, go back to the previous Monday
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

// Get Sunday (end of week in French system)
function getWeekEnd(date: Date): Date {
  const result = getWeekStart(date);
  result.setDate(result.getDate() + 6);
  return result;
}

// Format date without timezone conversion
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}