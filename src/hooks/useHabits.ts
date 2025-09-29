import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HabitCheck {
  id: string;
  habit_id: string;
  client_id: string;
  date: string;
  checked: boolean;
}

export interface Habit {
  id: string;
  key?: string;
  titre: string;
  description?: string;
  owner: 'coach' | 'client';
  default_active: boolean;
  assignment?: {
    id: string;
    active: boolean;
  };
  checks: HabitCheck[];
}

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchHabits = async () => {
      try {
        // Get current week dates
        const weekDates = getCurrentWeekDates();
        
        // Fetch habits with assignments and checks for current week
        const { data: habitsData, error: habitsError } = await supabase
          .from('habit')
          .select(`
            *,
            habit_assignment!inner (
              id,
              active
            )
          `)
          .eq('habit_assignment.client_id', user.id)
          .eq('habit_assignment.active', true);

        if (habitsError) throw habitsError;

        // Fetch habit checks for current week
        const habitIds = habitsData?.map(h => h.id) || [];
        
        const { data: checksData, error: checksError } = await supabase
          .from('habit_check')
          .select('*')
          .eq('client_id', user.id)
          .in('habit_id', habitIds)
          .gte('date', weekDates[0])
          .lte('date', weekDates[6]);

        if (checksError) throw checksError;

        // Combine data
        const habitsWithChecks: Habit[] = habitsData?.map(habit => ({
          ...habit,
          owner: habit.owner as 'coach' | 'client',
          assignment: habit.habit_assignment[0],
          checks: checksData?.filter(check => check.habit_id === habit.id) || []
        })) || [];

        setHabits(habitsWithChecks);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [user]);

  const toggleHabitCheck = async (habitId: string, date: string) => {
    if (!user) return;

    try {
      const existingCheck = habits
        .find(h => h.id === habitId)
        ?.checks.find(c => c.date === date);

      if (existingCheck) {
        // Update existing check
        const { error } = await supabase
          .from('habit_check')
          .update({ checked: !existingCheck.checked })
          .eq('id', existingCheck.id);

        if (error) throw error;

        // Update local state
        setHabits(prev => prev.map(habit => {
          if (habit.id === habitId) {
            return {
              ...habit,
              checks: habit.checks.map(check => 
                check.id === existingCheck.id 
                  ? { ...check, checked: !check.checked }
                  : check
              )
            };
          }
          return habit;
        }));
      } else {
        // Create new check
        const { data, error } = await supabase
          .from('habit_check')
          .insert({
            client_id: user.id,
            habit_id: habitId,
            date,
            checked: true
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setHabits(prev => prev.map(habit => {
          if (habit.id === habitId) {
            return {
              ...habit,
              checks: [...habit.checks, data]
            };
          }
          return habit;
        }));
      }
    } catch (err) {
      console.error('Error toggling habit check:', err);
    }
  };

  return { habits, loading, error, toggleHabitCheck };
};

function getCurrentWeekDates(): string[] {
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
}