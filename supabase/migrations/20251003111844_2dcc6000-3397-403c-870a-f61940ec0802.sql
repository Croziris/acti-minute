-- ==========================================
-- NETTOYAGE DES UTILISATEURS DE DÉMO
-- ==========================================

-- 1. Supprimer toutes les données liées à olivier (demo)
DELETE FROM habit_check WHERE client_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM habit_assignment WHERE client_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM set_log WHERE session_id IN (
  SELECT id FROM session WHERE client_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM exercise_feedback WHERE session_id IN (
  SELECT id FROM session WHERE client_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM session WHERE client_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM week_plan WHERE program_id IN (
  SELECT id FROM program WHERE client_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM workout_exercise WHERE workout_id IN (
  SELECT id FROM workout WHERE program_id IN (
    SELECT id FROM program WHERE client_id = '11111111-1111-1111-1111-111111111111'
  )
);
DELETE FROM workout WHERE program_id IN (
  SELECT id FROM program WHERE client_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM program WHERE client_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM program WHERE coach_id = '22222222-2222-2222-2222-222222222222';

-- 2. Supprimer les utilisateurs de démo
DELETE FROM app_user WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM app_user WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM credential WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM credential WHERE id = '22222222-2222-2222-2222-222222222222';

-- ==========================================
-- FONCTION HELPER POUR RÉCUPÉRER L'APP_USER_ID
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'app_user_id')::uuid,
    (SELECT id FROM app_user WHERE id = auth.uid())
  )
$$;

-- ==========================================
-- RECRÉER LES POLICIES AVEC get_app_user_id()
-- ==========================================

-- Supprimer les policies actuelles
DROP POLICY IF EXISTS "program_select_policy" ON public.program;
DROP POLICY IF EXISTS "program_insert_policy" ON public.program;
DROP POLICY IF EXISTS "program_update_policy" ON public.program;

DROP POLICY IF EXISTS "session_select_policy" ON public.session;
DROP POLICY IF EXISTS "session_insert_policy" ON public.session;
DROP POLICY IF EXISTS "session_update_policy" ON public.session;
DROP POLICY IF EXISTS "session_delete_policy" ON public.session;

DROP POLICY IF EXISTS "habit_assignment_select_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_manage_policy" ON public.habit_assignment;

DROP POLICY IF EXISTS "habit_check_policy" ON public.habit_check;

-- ==========================================
-- PROGRAM POLICIES
-- ==========================================

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

-- ==========================================
-- SESSION POLICIES
-- ==========================================

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

-- ==========================================
-- HABIT ASSIGNMENT POLICIES
-- ==========================================

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

-- ==========================================
-- HABIT CHECK POLICIES
-- ==========================================

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