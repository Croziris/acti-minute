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

    // Vérifier le rôle
    const { data: appUser, error: roleError } = await supabaseClient
      .from('app_user')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !appUser || appUser.role !== 'coach') {
      return new Response(
        JSON.stringify({ error: 'Rôle insuffisant - coach uniquement' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les données
    const {
      workout_id,
      program_id,
      exercise_id,
      series,
      reps,
      temps_seconds,
      charge_cible,
      tempo,
      couleur,
      tips,
      variations,
      createIfMissing = false
    } = await req.json();

    if (!exercise_id) {
      return new Response(
        JSON.stringify({ error: 'exercise_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let workoutId = workout_id;

    // Si pas de workout_id et createIfMissing, créer un workout brouillon
    if (!workoutId && createIfMissing && program_id) {
      const { data: newWorkout, error: workoutError } = await supabaseClient
        .from('workout')
        .insert({
          programme_id: program_id,
          titre: 'Séance en cours de création',
          description: '',
          duree_estimee: 60,
        })
        .select()
        .single();

      if (workoutError) {
        return new Response(
          JSON.stringify({ error: 'Impossible de créer le workout', details: workoutError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      workoutId = newWorkout.id;
    }

    if (!workoutId) {
      return new Response(
        JSON.stringify({ error: 'workout_id requis ou utilisez createIfMissing avec program_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtenir le prochain order_index
    const { data: existingExercises } = await supabaseClient
      .from('workout_exercise')
      .select('order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingExercises && existingExercises.length > 0
      ? (existingExercises[0].order_index || 0) + 1
      : 1;

    // Insérer l'exercice dans le workout
    const { data: workoutExercise, error: insertError } = await supabaseClient
      .from('workout_exercise')
      .insert({
        workout_id: workoutId,
        exercise_id,
        order_index: nextOrderIndex,
        series: series || null,
        reps: reps || null,
        temps_seconds: temps_seconds || null,
        charge_cible: charge_cible || null,
        tempo: tempo || null,
        couleur: couleur || null,
        tips: tips || null,
        variations: variations || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Échec d\'ajout de l\'exercice', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, workout_exercise: workoutExercise, workout_id: workoutId }),
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
