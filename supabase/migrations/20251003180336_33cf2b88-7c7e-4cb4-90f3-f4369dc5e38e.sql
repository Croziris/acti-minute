-- Corriger toutes les policies RLS pour utiliser get_app_user_id() au lieu de auth.uid()
-- Cela permet de mapper correctement auth.uid() (Supabase auth user) vers app_user.id

-- ====== TABLE: week_plan ======
DROP POLICY IF EXISTS "Coaches and clients can view week plans" ON public.week_plan;
CREATE POLICY "Coaches and clients can view week plans"
ON public.week_plan FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role IN ('coach', 'spotif.ve')
  )
);

DROP POLICY IF EXISTS "Coaches can insert week plans" ON public.week_plan;
CREATE POLICY "Coaches can insert week plans"
ON public.week_plan FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can update week plans" ON public.week_plan;
CREATE POLICY "Coaches can update week plans"
ON public.week_plan FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

-- ====== TABLE: session ======
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.session;
DROP POLICY IF EXISTS "session_select_policy" ON public.session;
CREATE POLICY "session_select_policy"
ON public.session FOR SELECT
TO authenticated
USING (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

DROP POLICY IF EXISTS "session_insert_policy" ON public.session;
CREATE POLICY "session_insert_policy"
ON public.session FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

DROP POLICY IF EXISTS "session_update_policy" ON public.session;
CREATE POLICY "session_update_policy"
ON public.session FOR UPDATE
TO authenticated
USING (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

DROP POLICY IF EXISTS "session_delete_policy" ON public.session;
CREATE POLICY "session_delete_policy"
ON public.session FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

-- ====== TABLE: exercise ======
DROP POLICY IF EXISTS "Coaches can insert exercises" ON public.exercise;
CREATE POLICY "Coaches can insert exercises"
ON public.exercise FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can update exercises" ON public.exercise;
CREATE POLICY "Coaches can update exercises"
ON public.exercise FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can delete their exercises" ON public.exercise;
CREATE POLICY "Coaches can delete their exercises"
ON public.exercise FOR DELETE
TO authenticated
USING (
  created_by = get_app_user_id()
  AND EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

-- ====== TABLE: workout ======
DROP POLICY IF EXISTS "Coaches and clients can view workouts" ON public.workout;
CREATE POLICY "Coaches and clients can view workouts"
ON public.workout FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
  OR EXISTS (
    SELECT 1 FROM session
    WHERE session.workout_id = workout.id
    AND session.client_id = get_app_user_id()
  )
);

DROP POLICY IF EXISTS "Coaches can insert workouts" ON public.workout;
CREATE POLICY "Coaches can insert workouts"
ON public.workout FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can update workouts" ON public.workout;
CREATE POLICY "Coaches can update workouts"
ON public.workout FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can delete template workouts" ON public.workout;
CREATE POLICY "Coaches can delete template workouts"
ON public.workout FOR DELETE
TO authenticated
USING (
  is_template = true
  AND EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

-- ====== TABLE: workout_exercise ======
DROP POLICY IF EXISTS "Coaches and clients can view workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches and clients can view workout exercises"
ON public.workout_exercise FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role IN ('coach', 'spotif.ve')
  )
);

DROP POLICY IF EXISTS "Coaches can insert workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can insert workout exercises"
ON public.workout_exercise FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can update workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can update workout exercises"
ON public.workout_exercise FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can delete workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can delete workout exercises"
ON public.workout_exercise FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

-- ====== TABLE: set_log ======
DROP POLICY IF EXISTS "Clients see own set logs" ON public.set_log;
CREATE POLICY "Clients see own set logs"
ON public.set_log FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = set_log.session_id
    AND session.client_id = get_app_user_id()
  )
);

-- ====== TABLE: exercise_feedback ======
DROP POLICY IF EXISTS "Clients see own exercise feedback" ON public.exercise_feedback;
CREATE POLICY "Clients see own exercise feedback"
ON public.exercise_feedback FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = exercise_feedback.session_id
    AND session.client_id = get_app_user_id()
  )
);

-- ====== TABLE: habit ======
DROP POLICY IF EXISTS "Clients can view habits" ON public.habit;
CREATE POLICY "Clients can view habits"
ON public.habit FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'spotif.ve'
  )
);

DROP POLICY IF EXISTS "Coaches can manage habits" ON public.habit;
CREATE POLICY "Coaches can manage habits"
ON public.habit FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = get_app_user_id()
    AND app_user.role = 'coach'
  )
);

-- ====== TABLE: app_user ======
DROP POLICY IF EXISTS "Coaches can view all sportif.ve" ON public.app_user;
CREATE POLICY "Coaches can view all sportif.ve"
ON public.app_user FOR SELECT
TO authenticated
USING (
  role = 'spotif.ve' AND EXISTS (
    SELECT 1 FROM app_user au
    WHERE au.id = get_app_user_id()
    AND au.role = 'coach'
  )
);

-- Note: La policy "Users see own data" reste inchangée car elle utilise déjà get_app_user_id()