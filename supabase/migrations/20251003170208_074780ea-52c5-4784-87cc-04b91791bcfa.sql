-- ==========================================
-- CRÉER LA FONCTION HELPER get_app_user_id()
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Essayer depuis user_metadata (cas de oliv et Pierre13)
    (auth.jwt() -> 'user_metadata' ->> 'app_user_id')::uuid,
    -- Fallback : si pas de metadata, utiliser auth.uid() directement
    auth.uid()
  )
$$;

-- ==========================================
-- SUPPRIMER LES POLICIES ACTUELLES
-- ==========================================

DROP POLICY IF EXISTS "program_select_policy" ON public.program;
DROP POLICY IF EXISTS "program_insert_policy" ON public.program;
DROP POLICY IF EXISTS "program_update_policy" ON public.program;

DROP POLICY IF EXISTS "session_select_policy" ON public.session;
DROP POLICY IF EXISTS "session_insert_policy" ON public.session;
DROP POLICY IF EXISTS "session_update_policy" ON public.session;
DROP POLICY IF EXISTS "session_delete_policy" ON public.session;

DROP POLICY IF EXISTS "habit_assignment_select_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_manage_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_insert_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_update_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_delete_policy" ON public.habit_assignment;

DROP POLICY IF EXISTS "habit_check_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_select_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_insert_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_update_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_delete_policy" ON public.habit_check;

-- ==========================================
-- RECRÉER TOUTES LES POLICIES AVEC get_app_user_id()
-- ==========================================

-- PROGRAM POLICIES
CREATE POLICY "program_select_policy"
ON public.program
FOR SELECT
TO authenticated
USING (
  client_id = get_app_user_id()
  OR coach_id = get_app_user_id()
);

CREATE POLICY "program_insert_policy"
ON public.program
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

CREATE POLICY "program_update_policy"
ON public.program
FOR UPDATE
TO authenticated
USING (
  coach_id = get_app_user_id()
  AND EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

-- SESSION POLICIES
CREATE POLICY "session_select_policy"
ON public.session
FOR SELECT
TO authenticated
USING (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

CREATE POLICY "session_insert_policy"
ON public.session
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
  OR client_id = get_app_user_id()
);

CREATE POLICY "session_update_policy"
ON public.session
FOR UPDATE
TO authenticated
USING (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

CREATE POLICY "session_delete_policy"
ON public.session
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = get_app_user_id()
  )
);

-- HABIT_ASSIGNMENT POLICIES
CREATE POLICY "habit_assignment_select_policy"
ON public.habit_assignment
FOR SELECT
TO authenticated
USING (
  client_id = get_app_user_id()
  OR EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

CREATE POLICY "habit_assignment_insert_policy"
ON public.habit_assignment
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

CREATE POLICY "habit_assignment_update_policy"
ON public.habit_assignment
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

CREATE POLICY "habit_assignment_delete_policy"
ON public.habit_assignment
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);

-- HABIT_CHECK POLICIES
CREATE POLICY "habit_check_select_policy"
ON public.habit_check
FOR SELECT
TO authenticated
USING (client_id = get_app_user_id());

CREATE POLICY "habit_check_insert_policy"
ON public.habit_check
FOR INSERT
TO authenticated
WITH CHECK (client_id = get_app_user_id());

CREATE POLICY "habit_check_update_policy"
ON public.habit_check
FOR UPDATE
TO authenticated
USING (client_id = get_app_user_id());

CREATE POLICY "habit_check_delete_policy"
ON public.habit_check
FOR DELETE
TO authenticated
USING (client_id = get_app_user_id());