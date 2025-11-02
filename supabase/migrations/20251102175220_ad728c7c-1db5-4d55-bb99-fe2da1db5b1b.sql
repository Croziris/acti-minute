-- Créer une table de liaison entre sessions et workouts
CREATE TABLE IF NOT EXISTS session_workout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id, workout_id),
  UNIQUE(session_id, order_index)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_session_workout_session 
ON session_workout(session_id, order_index);

CREATE INDEX IF NOT EXISTS idx_session_workout_workout 
ON session_workout(workout_id);

-- RLS policies pour session_workout
ALTER TABLE session_workout ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir les liens de leurs sessions
CREATE POLICY "Clients can view their session workouts"
ON session_workout FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = session_workout.session_id
    AND session.client_id = get_app_user_id()
  )
);

-- Les coaches peuvent gérer les liens des sessions de leurs clients
CREATE POLICY "Coaches can manage client session workouts"
ON session_workout FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM session s
    JOIN program p ON s.client_id = p.client_id
    WHERE s.id = session_workout.session_id
    AND p.coach_id = get_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session s
    JOIN program p ON s.client_id = p.client_id
    WHERE s.id = session_workout.session_id
    AND p.coach_id = get_app_user_id()
  )
);

-- Commentaires pour documentation
COMMENT ON TABLE session_workout IS 'Table de liaison permettant d''associer plusieurs workouts à une session (combinaison de séances)';
COMMENT ON COLUMN session_workout.order_index IS 'Ordre d''affichage des workouts dans la session (0 = premier, 1 = deuxième, etc.)';

-- Migrer les données existantes
INSERT INTO session_workout (session_id, workout_id, order_index)
SELECT id, workout_id, 0
FROM session
WHERE workout_id IS NOT NULL
ON CONFLICT (session_id, workout_id) DO NOTHING;

-- Rendre la colonne workout_id nullable
ALTER TABLE session 
ALTER COLUMN workout_id DROP NOT NULL;

-- Ajouter un commentaire pour clarifier
COMMENT ON COLUMN session.workout_id IS 'Workout ID (legacy - utilisé pour les anciennes sessions simples, NULL pour les sessions combinées qui utilisent session_workout)';