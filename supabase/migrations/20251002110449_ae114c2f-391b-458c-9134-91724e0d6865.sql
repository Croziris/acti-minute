-- Permettre aux coaches de voir tous les programmes (pas seulement les leurs)
DROP POLICY IF EXISTS "Coaches and clients can view programs" ON public.program;

CREATE POLICY "Users can view relevant programs"
ON public.program
FOR SELECT
USING (
  auth.uid() = client_id 
  OR auth.uid() = coach_id
  OR public.is_coach()
);