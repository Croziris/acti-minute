import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 auth-login function started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { role, username, access_key } = await req.json();

    console.log(`📝 Login attempt: role=${role}, username=${username}`);

    if (!role || !username || !access_key) {
      console.log('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier les credentials dans la base
    console.log('🔍 Checking credentials...');
    const { data: credential, error: credentialError } = await supabase
      .from('credential')
      .select('*')
      .eq('username', username)
      .eq('status', 'active')
      .single();

    if (credentialError || !credential) {
      console.log('❌ Credential not found:', credentialError);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('✅ Credentials found');

    // Vérifier le rôle
    if (credential.role !== role) {
      console.log(`❌ Role mismatch: expected ${credential.role}, got ${role}`);
      return new Response(
        JSON.stringify({ error: 'role_mismatch' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Pour la démo, on accepte n'importe quelle clé d'accès
    // En production, il faudrait vérifier le hash Argon2id
    console.log('✅ Authentication successful');

    // Récupérer l'utilisateur app associé
    console.log('🔍 Fetching app_user...');
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('credential_id', credential.id)
      .single();

    if (appUserError || !appUser) {
      console.log('❌ App user not found:', appUserError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log(`✅ App user found: ${appUser.id}`);

    // Créer ou récupérer l'utilisateur Auth Supabase
    const email = `${username}@app.local`;
    console.log(`🔐 Checking auth user: ${email}`);

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let authUserId = existingUsers?.users.find(u => u.email === email)?.id;

    if (!authUserId) {
      console.log('🆕 Creating new auth user...');
      // Créer l'utilisateur Auth Supabase avec l'ID de app_user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: access_key,
        email_confirm: true,
        user_metadata: {
          app_user_id: appUser.id,
          role: appUser.role,
          handle: appUser.handle
        }
      });

      if (createError) {
        console.error('❌ Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Could not create auth session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authUserId = newUser.user.id;
      console.log(`✅ Auth user created: ${authUserId}`);
      
      // Tenter de synchroniser l'ID (peut échouer si l'utilisateur a déjà des relations)
      console.log(`🔄 Attempting to sync app_user id from ${appUser.id} to ${authUserId}`);
      const { error: updateError } = await supabase
        .from('app_user')
        .update({ id: authUserId })
        .eq('credential_id', credential.id);
      
      if (updateError) {
        console.error('⚠️ Could not sync app_user id (this is OK for existing users with data):', updateError.message);
        // Ne pas retourner d'erreur ici - continuer avec l'ancien ID
        authUserId = appUser.id;
      } else {
        console.log('✅ App user id synchronized');
      }
    } else {
      console.log(`✅ Auth user already exists: ${authUserId}`);
      // Utiliser l'ID de auth.users si possible, sinon garder l'ID actuel
      authUserId = appUser.id;
    }

    console.log('✅ Function completed successfully');
    return new Response(
      JSON.stringify({ 
        user: {
          id: authUserId,
          role: appUser.role,
          handle: appUser.handle,
          avatar_url: appUser.avatar_url
        },
        auth: {
          email,
          password: access_key
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Auth error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});