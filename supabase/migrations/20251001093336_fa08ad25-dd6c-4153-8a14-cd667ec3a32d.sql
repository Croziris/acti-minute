-- RLS Policies pour autoriser les coachs à écrire

-- Exercise: Autoriser les coachs à créer et modifier des exercices
CREATE POLICY "Coaches can insert exercises"
ON public.exercise
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update exercises"
ON public.exercise
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

-- Workout: Autoriser les coachs à créer et modifier des workouts
CREATE POLICY "Coaches can insert workouts"
ON public.workout
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update workouts"
ON public.workout
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches and clients can view workouts"
ON public.workout
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND (role = 'coach' OR role = 'spotif.ve')
  )
);

-- Workout Exercise: Autoriser les coachs à gérer les exercices des workouts
CREATE POLICY "Coaches can insert workout exercises"
ON public.workout_exercise
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update workout exercises"
ON public.workout_exercise
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can delete workout exercises"
ON public.workout_exercise
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches and clients can view workout exercises"
ON public.workout_exercise
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND (role = 'coach' OR role = 'spotif.ve')
  )
);

-- Program: Autoriser les coachs à gérer les programmes
CREATE POLICY "Coaches can insert programs"
ON public.program
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update programs"
ON public.program
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches and clients can view programs"
ON public.program
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND (role = 'coach' OR role = 'spotif.ve')
  )
);

-- Week Plan: Autoriser les coachs à gérer les plans hebdomadaires
CREATE POLICY "Coaches can insert week plans"
ON public.week_plan
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update week plans"
ON public.week_plan
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Coaches and clients can view week plans"
ON public.week_plan
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND (role = 'coach' OR role = 'spotif.ve')
  )
);