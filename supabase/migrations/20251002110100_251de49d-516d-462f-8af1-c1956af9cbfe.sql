-- Supprimer l'ancienne policy qui cause une récursion
DROP POLICY IF EXISTS "Coaches can view clients" ON public.app_user;

-- Créer une fonction security definer pour vérifier si l'utilisateur est un coach
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role = 'coach'
  );
$$;

-- Créer une nouvelle policy sans récursion
CREATE POLICY "Coaches can view all sportif.ve"
ON public.app_user
FOR SELECT
USING (
  role = 'spotif.ve' AND public.is_coach()
);