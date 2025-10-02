-- Ajouter une policy permettant aux coaches de voir les sportif.ve
CREATE POLICY "Coaches can view clients"
ON public.app_user
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_user coach
    WHERE coach.id = auth.uid() 
    AND coach.role = 'coach'
    AND app_user.role = 'spotif.ve'
  )
);