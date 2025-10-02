-- 1. Supprimer la policy "Clients see own sessions" qui est trop permissive (ALL)
DROP POLICY IF EXISTS "Clients see own sessions" ON public.session;

-- 2. Créer des policies plus spécifiques pour les clients
CREATE POLICY "Clients can view their own sessions"
ON public.session
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can update their own sessions"
ON public.session
FOR UPDATE
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can insert their own sessions"
ON public.session
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- 3. Ajouter les policies pour les coachs
CREATE POLICY "Coaches can view their clients sessions"
ON public.session
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert sessions for their clients"
ON public.session
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update their clients sessions"
ON public.session
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program
    WHERE program.client_id = session.client_id
    AND program.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete their clients sessions"
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

-- 4. Permettre aux coachs de supprimer leurs exercices
CREATE POLICY "Coaches can delete their exercises"
ON public.exercise
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);