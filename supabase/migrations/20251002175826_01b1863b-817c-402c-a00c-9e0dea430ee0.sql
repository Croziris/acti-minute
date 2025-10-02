-- Créer une fonction helper plus robuste qui gère tous les cas
CREATE OR REPLACE FUNCTION public.get_current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- D'abord essayer depuis les métadonnées
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'app_user_id')::uuid,
    -- Sinon vérifier si l'auth.uid existe directement dans app_user
    (SELECT id FROM app_user WHERE id = auth.uid())
  )
$$;

-- Recréer toutes les politiques program avec la nouvelle fonction
DROP POLICY IF EXISTS "Clients can view their programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can view their client programs" ON public.program;

CREATE POLICY "Clients view programs"
ON public.program
FOR SELECT
USING (
  client_id = get_current_app_user_id()
  OR coach_id = get_current_app_user_id()
  OR EXISTS (SELECT 1 FROM app_user WHERE id = get_current_app_user_id() AND role = 'coach')
);

-- Politiques pour les sessions
DROP POLICY IF EXISTS "Clients can view their sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches can view client sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can update their sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can insert their sessions" ON public.session;

CREATE POLICY "Users view sessions"
ON public.session
FOR SELECT
USING (
  client_id = get_current_app_user_id()
  OR EXISTS (
    SELECT 1 FROM program 
    WHERE program.client_id = session.client_id 
    AND program.coach_id = get_current_app_user_id()
  )
);

CREATE POLICY "Clients modify sessions"
ON public.session
FOR ALL
USING (client_id = get_current_app_user_id())
WITH CHECK (client_id = get_current_app_user_id());

CREATE POLICY "Coaches manage sessions"
ON public.session
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM program 
    WHERE program.client_id = session.client_id 
    AND program.coach_id = get_current_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM program 
    WHERE program.client_id = session.client_id 
    AND program.coach_id = get_current_app_user_id()
  )
);

-- Politiques pour habit_assignment
DROP POLICY IF EXISTS "Clients can view their assignments" ON public.habit_assignment;

CREATE POLICY "Users view assignments"
ON public.habit_assignment
FOR SELECT
USING (
  client_id = get_current_app_user_id()
  OR EXISTS (SELECT 1 FROM app_user WHERE id = get_current_app_user_id() AND role = 'coach')
);

-- Politiques pour habit_check
DROP POLICY IF EXISTS "Clients view habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients insert habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients update habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients delete habit checks" ON public.habit_check;

CREATE POLICY "Users manage habit checks"
ON public.habit_check
FOR ALL
USING (client_id = get_current_app_user_id())
WITH CHECK (client_id = get_current_app_user_id());