-- Corriger les warnings RLS : ajouter les policies manquantes

-- Credential: Uniquement accessible en interne (via edge functions)
CREATE POLICY "No direct access to credentials"
ON public.credential
FOR ALL
TO authenticated
USING (false);

-- Habit: Les coachs peuvent gérer toutes les habitudes
CREATE POLICY "Coaches can manage habits"
ON public.habit
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Clients can view habits"
ON public.habit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'spotif.ve'
  )
);

-- Habit Assignment: Les coachs gèrent les assignations
CREATE POLICY "Coaches can manage habit assignments"
ON public.habit_assignment
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid() AND role = 'coach'
  )
);

CREATE POLICY "Clients can view their habit assignments"
ON public.habit_assignment
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
);