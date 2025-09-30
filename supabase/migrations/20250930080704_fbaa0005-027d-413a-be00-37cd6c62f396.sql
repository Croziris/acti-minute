-- Créer les credentials et utilisateurs
DO $$
DECLARE
  olivier_id uuid := '11111111-1111-1111-1111-111111111111';
  pierre_id uuid := '22222222-2222-2222-2222-222222222222';
  ex_pompes_id uuid;
  ex_squat_id uuid;
  ex_crunch_id uuid;
  prog_id uuid;
  workout_id uuid;
  week_plan_id uuid;
  hab1_id uuid;
  hab2_id uuid;
  hab3_id uuid;
BEGIN
  -- Créer les credentials
  INSERT INTO credential (id, username, secret_hash, role, status) VALUES
    (olivier_id, 'olivier', 'demo', 'spotif.ve', 'active'),
    (pierre_id, 'pierre', 'demo', 'coach', 'active');

  -- Créer les app_user
  INSERT INTO app_user (id, credential_id, role, handle) VALUES
    (olivier_id, olivier_id, 'spotif.ve', 'olivier_martin'),
    (pierre_id, pierre_id, 'coach', 'pierre_coach');

  -- Créer les exercices
  INSERT INTO exercise (libelle, description, categories, groupes, niveau, materiel, youtube_url, video_id, verified) 
  VALUES
    ('Pompes', 'Exercice de base pour le haut du corps. Placez vos mains à la largeur des épaules, descendez en contrôlant, puis poussez.', ARRAY['force', 'poids_corps'], ARRAY['pectoraux', 'triceps', 'epaules'], 'débutant', ARRAY['aucun'], 'https://www.youtube.com/watch?v=IODxDxX7oi4', 'IODxDxX7oi4', true)
  RETURNING id INTO ex_pompes_id;

  INSERT INTO exercise (libelle, description, categories, groupes, niveau, materiel, youtube_url, video_id, verified) 
  VALUES
    ('Squat', 'Exercice fondamental pour le bas du corps. Pieds écartés largeur des hanches, descendez en gardant le dos droit.', ARRAY['force', 'poids_corps'], ARRAY['quadriceps', 'fessiers', 'ischio-jambiers'], 'débutant', ARRAY['aucun'], 'https://www.youtube.com/watch?v=aclHkVaku9U', 'aclHkVaku9U', true)
  RETURNING id INTO ex_squat_id;

  INSERT INTO exercise (libelle, description, categories, groupes, niveau, materiel, youtube_url, video_id, verified) 
  VALUES
    ('Crunch', 'Exercice d''isolation pour les abdominaux. Allongé sur le dos, genoux fléchis, montez les épaules vers les genoux.', ARRAY['force', 'poids_corps'], ARRAY['abdominaux'], 'débutant', ARRAY['tapis'], 'https://www.youtube.com/watch?v=Xyd_fa5zoEU', 'Xyd_fa5zoEU', true)
  RETURNING id INTO ex_crunch_id;

  -- Créer le programme
  INSERT INTO program (titre, objectif, client_id, coach_id, statut) 
  VALUES
    ('Programme Remise en Forme', 'Développer la force et l''endurance musculaire', olivier_id, pierre_id, 'published')
  RETURNING id INTO prog_id;

  -- Créer le workout
  INSERT INTO workout (titre, description, program_id, duree_estimee) 
  VALUES
    ('Séance Full Body', 'Séance complète travaillant tout le corps', prog_id, 45)
  RETURNING id INTO workout_id;

  -- Ajouter les exercices au workout
  INSERT INTO workout_exercise (workout_id, exercise_id, order_index, series, reps, tempo, tips) VALUES
    (workout_id, ex_pompes_id, 1, 3, 12, '2-0-2-0', 'Gardez le corps gainé et aligné'),
    (workout_id, ex_squat_id, 2, 4, 15, '3-0-1-0', 'Ne laissez pas les genoux dépasser les orteils'),
    (workout_id, ex_crunch_id, 3, 3, 20, '2-1-2-0', 'Contractez bien les abdos en haut du mouvement');

  -- Créer le week_plan
  INSERT INTO week_plan (program_id, iso_week, start_date, end_date, expected_sessions) 
  VALUES
    (prog_id, EXTRACT(WEEK FROM CURRENT_DATE)::integer, DATE_TRUNC('week', CURRENT_DATE)::date, (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date, 3)
  RETURNING id INTO week_plan_id;

  -- Créer les sessions
  INSERT INTO session (client_id, workout_id, week_plan_id, index_num, statut) VALUES
    (olivier_id, workout_id, week_plan_id, 1, 'planned'),
    (olivier_id, workout_id, week_plan_id, 2, 'planned'),
    (olivier_id, workout_id, week_plan_id, 3, 'planned');

  -- Créer les habitudes
  INSERT INTO habit (titre, description, key, owner, default_active) 
  VALUES
    ('Boire 2L d''eau', 'Rester bien hydraté tout au long de la journée', 'hydratation', 'coach', true)
  RETURNING id INTO hab1_id;

  INSERT INTO habit (titre, description, key, owner, default_active) 
  VALUES
    ('Dormir 8h', 'Assurer une récupération optimale', 'sommeil', 'coach', true)
  RETURNING id INTO hab2_id;

  INSERT INTO habit (titre, description, key, owner, default_active) 
  VALUES
    ('Étirements', 'Faire 10 minutes d''étirements', 'etirements', 'coach', true)
  RETURNING id INTO hab3_id;

  -- Assigner les habitudes à Olivier
  INSERT INTO habit_assignment (habit_id, client_id, active) VALUES
    (hab1_id, olivier_id, true),
    (hab2_id, olivier_id, true),
    (hab3_id, olivier_id, true);
END $$;