-- Corriger get_app_user_id() pour utiliser app_metadata (sécurisé) au lieu de user_metadata
-- user_metadata est modifiable par le client et ne doit PAS être utilisé dans RLS
-- Utiliser CREATE OR REPLACE au lieu de DROP pour éviter les problèmes de dépendances

CREATE OR REPLACE FUNCTION public.get_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    -- Lire depuis app_metadata (non modifiable par le client)
    (auth.jwt() -> 'app_metadata' ->> 'app_user_id')::uuid,
    -- Fallback : utiliser auth.uid() directement
    auth.uid()
  )
$$;

-- S'assurer que seuls les utilisateurs authentifiés peuvent appeler cette fonction
REVOKE EXECUTE ON FUNCTION public.get_app_user_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_app_user_id() TO authenticated;