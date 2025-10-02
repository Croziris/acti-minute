-- Migrer les utilisateurs vers auth.users et créer une fonction de synchronisation

-- Fonction pour créer un utilisateur Supabase Auth depuis credential
CREATE OR REPLACE FUNCTION create_auth_user_from_credential(
  p_credential_id uuid,
  p_email text,
  p_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_app_user_id uuid;
BEGIN
  -- Créer l'utilisateur dans auth.users avec un email fictif basé sur username
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Mettre à jour app_user avec l'id auth
  UPDATE app_user 
  SET id = v_user_id 
  WHERE credential_id = p_credential_id
  RETURNING id INTO v_app_user_id;

  RETURN v_user_id;
END;
$$;

-- Note: Pour migrer les utilisateurs existants, vous devrez appeler cette fonction manuellement
-- avec les credentials de chaque utilisateur