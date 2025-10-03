-- Corriger la policy INSERT pour program
-- Le problème : la policy ne vérifie pas que coach_id correspond à l'utilisateur actuel
-- Solution : ajouter une vérification que coach_id = get_app_user_id()

DROP POLICY IF EXISTS "program_insert_policy" ON public.program;

CREATE POLICY "program_insert_policy"
ON public.program
FOR INSERT
TO authenticated
WITH CHECK (
  coach_id = get_app_user_id()
  AND EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = get_app_user_id() 
    AND role = 'coach'
  )
);