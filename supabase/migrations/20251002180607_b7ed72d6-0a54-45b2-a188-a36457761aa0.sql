-- Nettoyer et recréer toutes les politiques program correctement
-- Supprimer TOUTES les anciennes politiques d'abord
DROP POLICY IF EXISTS "Clients view programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can insert programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can update programs" ON public.program;
DROP POLICY IF EXISTS "Coaches can view their client programs" ON public.program;
DROP POLICY IF EXISTS "Clients can view their programs" ON public.program;

-- Recréer les politiques correctement
-- SELECT : Les clients voient leurs programmes, les coaches voient tous les programmes
CREATE POLICY "Clients view programs"
ON public.program
FOR SELECT
USING (
  client_id = get_current_app_user_id()
  OR coach_id = get_current_app_user_id()
  OR EXISTS (SELECT 1 FROM app_user WHERE id = get_current_app_user_id() AND role = 'coach')
);

-- INSERT : Les coaches peuvent créer des programmes (utiliser auth.uid() pour les checks)
CREATE POLICY "Coaches can insert programs"
ON public.program
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);

-- UPDATE : Les coaches peuvent modifier tous les programmes
CREATE POLICY "Coaches can update programs"
ON public.program
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM app_user WHERE id = auth.uid() AND role = 'coach')
);