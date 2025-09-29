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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { role, username, access_key } = await req.json();

    console.log(`Login attempt: role=${role}, username=${username}`);

    if (!role || !username || !access_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier les credentials dans la base
    const { data: credential, error: credentialError } = await supabase
      .from('credential')
      .select('*')
      .eq('username', username)
      .eq('status', 'active')
      .single();

    if (credentialError || !credential) {
      console.log('Credential not found:', credentialError);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier le rôle
    if (credential.role !== role) {
      console.log(`Role mismatch: expected ${credential.role}, got ${role}`);
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
    console.log('Authentication successful');

    // Récupérer l'utilisateur app associé
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('credential_id', credential.id)
      .single();

    if (appUserError || !appUser) {
      console.log('App user not found:', appUserError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        user: {
          id: appUser.id,
          role: appUser.role,
          handle: appUser.handle,
          avatar_url: appUser.avatar_url
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});