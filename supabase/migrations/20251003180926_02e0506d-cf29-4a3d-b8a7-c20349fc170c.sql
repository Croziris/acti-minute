-- Corriger is_coach() et is_client() pour utiliser get_app_user_id()
-- Cela permet de mapper correctement auth.uid() (table auth.users) vers app_user.id

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = get_app_user_id() AND role = 'coach'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = get_app_user_id() AND role = 'spotif.ve'
  );
$$;