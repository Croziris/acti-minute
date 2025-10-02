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
    console.log('🚀 create-exercise function started');
    
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
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    console.log('Auth check result:', { userId: user?.id, hasError: !!authError, errorCode: authError?.code });
    
    if (authError || !user) {
      console.log('❌ Authentication failed');
      return new Response(
        JSON.stringify({ error: 'Non authentifié', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`✅ User authenticated: ${user.id}`);

    // Vérifier le rôle
    console.log('🔍 Checking user role...');
    const { data: appUser, error: roleError } = await supabaseClient
      .from('app_user')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Role check result:', { role: appUser?.role, hasError: !!roleError, errorMessage: roleError?.message });

    if (roleError || !appUser || appUser.role !== 'coach') {
      console.log('❌ Role check failed');
      return new Response(
        JSON.stringify({ error: 'Rôle insuffisant - coach uniquement', details: roleError?.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ User is coach');

    // Récupérer les données
    console.log('📝 Parsing request body...');
    const { libelle, description, youtube_url, categories, groupes, niveau, materiel } = await req.json();
    console.log('Request data:', { libelle, hasDescription: !!description, hasYoutubeUrl: !!youtube_url });

    // Validation
    if (!libelle || libelle.trim() === '') {
      console.log('❌ Validation failed: libelle is required');
      return new Response(
        JSON.stringify({ error: 'Le libellé est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire video_id depuis YouTube URL
    let video_id = '';
    if (youtube_url) {
      console.log('🎥 Extracting YouTube video ID...');
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
      const match = youtube_url.match(youtubeRegex);
      if (!match) {
        console.log('❌ Invalid YouTube URL');
        return new Response(
          JSON.stringify({ error: 'URL YouTube invalide' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      video_id = match[1];
      console.log(`✅ Video ID extracted: ${video_id}`);
    }

    // Insérer l'exercice
    console.log('💾 Inserting exercise into database...');
    const { data: exercise, error: insertError } = await supabaseClient
      .from('exercise')
      .insert({
        libelle: libelle.trim(),
        description: description?.trim() || null,
        youtube_url: youtube_url || null,
        video_id: video_id || null,
        video_provider: youtube_url ? 'youtube' : null,
        categories: categories || [],
        groupes: groupes || [],
        niveau: niveau || null,
        materiel: materiel || [],
        created_by: user.id,
        verified: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Échec d\'écriture en base', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Exercise created successfully:', exercise.id);
    return new Response(
      JSON.stringify({ success: true, exercise }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
        details: error instanceof Error ? error.stack : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
