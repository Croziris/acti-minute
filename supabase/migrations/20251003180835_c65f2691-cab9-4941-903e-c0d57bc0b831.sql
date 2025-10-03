-- Corriger la récursion infinie dans les policies RLS
-- Créer une fonction is_client() similaire à is_coach() et corriger toutes les policies

-- Créer la fonction is_client() (similaire à is_coach())
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role = 'spotif.ve'
  );
$$;

-- Corriger is_coach() pour utiliser auth.uid() directement (pas get_app_user_id())
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role = 'coach'
  );
$$;

-- ====== TABLE: app_user ======
DROP POLICY IF EXISTS "Coaches can view all sportif.ve" ON public.app_user;
CREATE POLICY "Coaches can view all sportif.ve"
ON public.app_user FOR SELECT
TO authenticated
USING (
  role = 'spotif.ve' AND is_coach()
);

-- ====== TABLE: habit ======
DROP POLICY IF EXISTS "Clients can view habits" ON public.habit;
CREATE POLICY "Clients can view habits"
ON public.habit FOR SELECT
TO authenticated
USING (is_client());

DROP POLICY IF EXISTS "Coaches can manage habits" ON public.habit;
CREATE POLICY "Coaches can manage habits"
ON public.habit FOR ALL
TO authenticated
USING (is_coach());

-- ====== TABLE: week_plan ======
DROP POLICY IF EXISTS "Coaches and clients can view week plans" ON public.week_plan;
CREATE POLICY "Coaches and clients can view week plans"
ON public.week_plan FOR SELECT
TO authenticated
USING (is_coach() OR is_client());

DROP POLICY IF EXISTS "Coaches can insert week plans" ON public.week_plan;
CREATE POLICY "Coaches can insert week plans"
ON public.week_plan FOR INSERT
TO authenticated
WITH CHECK (is_coach());

DROP POLICY IF EXISTS "Coaches can update week plans" ON public.week_plan;
CREATE POLICY "Coaches can update week plans"
ON public.week_plan FOR UPDATE
TO authenticated
USING (is_coach());

-- ====== TABLE: exercise ======
DROP POLICY IF EXISTS "Coaches can insert exercises" ON public.exercise;
CREATE POLICY "Coaches can insert exercises"
ON public.exercise FOR INSERT
TO authenticated
WITH CHECK (is_coach());

DROP POLICY IF EXISTS "Coaches can update exercises" ON public.exercise;
CREATE POLICY "Coaches can update exercises"
ON public.exercise FOR UPDATE
TO authenticated
USING (is_coach());

DROP POLICY IF EXISTS "Coaches can delete their exercises" ON public.exercise;
CREATE POLICY "Coaches can delete their exercises"
ON public.exercise FOR DELETE
TO authenticated
USING (
  created_by = get_app_user_id()
  AND is_coach()
);

-- ====== TABLE: workout ======
DROP POLICY IF EXISTS "Coaches and clients can view workouts" ON public.workout;
CREATE POLICY "Coaches and clients can view workouts"
ON public.workout FOR SELECT
TO authenticated
USING (
  is_coach()
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
WITH CHECK (is_coach());

DROP POLICY IF EXISTS "Coaches can update workouts" ON public.workout;
CREATE POLICY "Coaches can update workouts"
ON public.workout FOR UPDATE
TO authenticated
USING (is_coach());

DROP POLICY IF EXISTS "Coaches can delete template workouts" ON public.workout;
CREATE POLICY "Coaches can delete template workouts"
ON public.workout FOR DELETE
TO authenticated
USING (is_template = true AND is_coach());

-- ====== TABLE: workout_exercise ======
DROP POLICY IF EXISTS "Coaches and clients can view workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches and clients can view workout exercises"
ON public.workout_exercise FOR SELECT
TO authenticated
USING (is_coach() OR is_client());

DROP POLICY IF EXISTS "Coaches can insert workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can insert workout exercises"
ON public.workout_exercise FOR INSERT
TO authenticated
WITH CHECK (is_coach());

DROP POLICY IF EXISTS "Coaches can update workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can update workout exercises"
ON public.workout_exercise FOR UPDATE
TO authenticated
USING (is_coach());

DROP POLICY IF EXISTS "Coaches can delete workout exercises" ON public.workout_exercise;
CREATE POLICY "Coaches can delete workout exercises"
ON public.workout_exercise FOR DELETE
TO authenticated
USING (is_coach());