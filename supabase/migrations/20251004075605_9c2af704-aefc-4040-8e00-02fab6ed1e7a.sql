-- 1. Permettre au coach de voir les set_log de ses clients
CREATE POLICY "Coaches can view client set logs"
ON public.set_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session s
    JOIN program p ON s.client_id = p.client_id
    WHERE s.id = set_log.session_id
    AND p.coach_id = get_app_user_id()
  )
);

-- 2. Permettre au coach de voir les exercise_feedback de ses clients
CREATE POLICY "Coaches can view client feedback"
ON public.exercise_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session s
    JOIN program p ON s.client_id = p.client_id
    WHERE s.id = exercise_feedback.session_id
    AND p.coach_id = get_app_user_id()
  )
);

-- 3. Permettre au coach de voir les habit_check de ses clients
CREATE POLICY "Coaches can view client habit checks"
ON public.habit_check
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = habit_check.client_id
    AND program.coach_id = get_app_user_id()
  )
);

-- 4. Ajouter colonne pour temps de repos entre tours dans circuit training
ALTER TABLE workout 
ADD COLUMN IF NOT EXISTS temps_repos_tours_seconds INT;

-- Mettre à jour les workouts circuit existants avec une valeur par défaut
UPDATE workout 
SET temps_repos_tours_seconds = 60 
WHERE workout_type = 'circuit' AND temps_repos_tours_seconds IS NULL;