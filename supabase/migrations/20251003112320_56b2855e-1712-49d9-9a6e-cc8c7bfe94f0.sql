-- ==========================================
-- NETTOYAGE COMPLET DES POLICIES
-- ==========================================

-- 1. Supprimer TOUTES les policies existantes sur les tables concernées
DROP POLICY IF EXISTS "program_select_policy" ON public.program;
DROP POLICY IF EXISTS "program_insert_policy" ON public.program;
DROP POLICY IF EXISTS "program_update_policy" ON public.program;
DROP POLICY IF EXISTS "Clients view programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can insert programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can update programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can view their client programs" ON public.program;
DROP POLICY IF EXISTS "Clients can view their programs" ON public.program;

DROP POLICY IF EXISTS "session_select_policy" ON public.session;
DROP POLICY IF EXISTS "session_insert_policy" ON public.session;
DROP POLICY IF EXISTS "session_update_policy" ON public.session;
DROP POLICY IF EXISTS "session_delete_policy" ON public.session;
DROP POLICY IF EXISTS "Users view sessions" ON public.session;
DROP POLICY IF EXISTS "Clients modify sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches manage sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can view their sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches can view client sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches can insert sessions for their clients" ON public.session;
DROP POLICY IF EXISTS "Coaches can update their clients sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches can delete their clients sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can update their sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can insert their sessions" ON public.session;

DROP POLICY IF EXISTS "habit_assignment_select_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_insert_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_update_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_delete_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "habit_assignment_manage_policy" ON public.habit_assignment;
DROP POLICY IF EXISTS "Users view assignments" ON public.habit_assignment;
DROP POLICY IF EXISTS "Coaches can manage habit assignments" ON public.habit_assignment;
DROP POLICY IF EXISTS "Clients can view their habit assignments" ON public.habit_assignment;
DROP POLICY IF EXISTS "Clients can view their assignments" ON public.habit_assignment;

DROP POLICY IF EXISTS "habit_check_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_select_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_insert_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_update_policy" ON public.habit_check;
DROP POLICY IF EXISTS "habit_check_delete_policy" ON public.habit_check;
DROP POLICY IF EXISTS "Users manage habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can view their habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can insert their habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can update their habit checks" ON public.habit_check;

-- 2. Supprimer les fonctions helper
DROP FUNCTION IF EXISTS get_current_app_user_id();
DROP FUNCTION IF EXISTS get_app_user_id();

-- ==========================================
-- NOUVELLES POLICIES SIMPLES ET FONCTIONNELLES
-- ==========================================

-- PROGRAM
-- Les clients voient leurs programmes, les coaches voient tous les programmes de leurs clients
CREATE POLICY "program_select_policy"
ON public.program
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR coach_id = auth.uid()
);

-- Les coaches peuvent créer des programmes
CREATE POLICY "program_insert_policy"
ON public.program
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);

-- Les coaches peuvent modifier leurs programmes
CREATE POLICY "program_update_policy"
ON public.program
FOR UPDATE
TO authenticated
USING (
  coach_id = auth.uid()
  AND EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);

-- SESSION
-- Les clients voient leurs sessions, les coaches voient les sessions de leurs clients
CREATE POLICY "session_select_policy"
ON public.session
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

-- Les coaches peuvent créer des sessions pour leurs clients
CREATE POLICY "session_insert_policy"
ON public.session
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
  OR client_id = auth.uid()
);

-- Les coaches et clients peuvent modifier les sessions
CREATE POLICY "session_update_policy"
ON public.session
FOR UPDATE
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

-- Les coaches peuvent supprimer les sessions
CREATE POLICY "session_delete_policy"
ON public.session
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

-- HABIT_ASSIGNMENT
-- Les clients voient leurs assignations, les coaches voient toutes les assignations
CREATE POLICY "habit_assignment_select_policy"
ON public.habit_assignment
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);

-- Les coaches peuvent gérer les assignations
CREATE POLICY "habit_assignment_manage_policy"
ON public.habit_assignment
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);

-- HABIT_CHECK
-- Les clients gèrent leurs propres checks
CREATE POLICY "habit_check_policy"
ON public.habit_check
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());