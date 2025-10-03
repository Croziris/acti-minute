import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le vrai app_user_id depuis les métadonnées ou utiliser user.id comme fallback
    // Utiliser app_metadata (sécurisé) et non user_metadata (modifiable par le client)
    const appUserId = user.app_metadata?.app_user_id || user.id;

    // Vérifier le rôle
    const { data: appUser, error: roleError } = await supabaseClient
      .from('app_user')
      .select('role')
      .eq('id', appUserId)
      .single();

    if (roleError || !appUser || appUser.role !== 'coach') {
      return new Response(
        JSON.stringify({ error: 'Rôle insuffisant - coach uniquement' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer client_id
    const { client_id } = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le client existe et est bien sportif.ve
    const { data: client, error: clientError } = await supabaseClient
      .from('app_user')
      .select('role')
      .eq('id', client_id)
      .single();

    if (clientError || !client || client.role !== 'spotif.ve') {
      return new Response(
        JSON.stringify({ error: 'Client non trouvé ou rôle invalide' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si une relation existe déjà
    const { data: existingProgram } = await supabaseClient
      .from('program')
      .select('id')
      .eq('client_id', client_id)
      .eq('coach_id', appUserId)
      .maybeSingle();

    if (existingProgram) {
      return new Response(
        JSON.stringify({ success: true, message: 'Relation déjà existante', program_id: existingProgram.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un programme pour lier coach et client
    const { data: program, error: programError } = await supabaseClient
      .from('program')
      .insert({
        client_id,
        coach_id: appUserId,
        titre: 'Programme personnalisé',
        statut: 'draft',
      })
      .select()
      .single();

    if (programError) {
      console.error('Program creation error:', programError);
      return new Response(
        JSON.stringify({ error: 'Échec de création du lien', details: programError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, program }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
