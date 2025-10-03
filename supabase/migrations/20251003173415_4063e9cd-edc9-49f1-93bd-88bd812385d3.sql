-- Corriger la policy RLS sur app_user pour utiliser get_app_user_id()
-- Problème : la policy "Users see own data" utilise auth.uid() directement
-- alors que appUserId peut être différent (stocké dans user_metadata)

DROP POLICY IF EXISTS "Users see own data" ON public.app_user;

CREATE POLICY "Users see own data"
ON public.app_user
FOR ALL
TO authenticated
USING (id = get_app_user_id());