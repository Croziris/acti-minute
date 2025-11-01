-- Ajouter les colonnes manquantes à exercise_feedback
ALTER TABLE exercise_feedback
ADD COLUMN IF NOT EXISTS rpe integer CHECK (rpe >= 1 AND rpe <= 10);

ALTER TABLE exercise_feedback
ADD COLUMN IF NOT EXISTS feedback_type text 
CHECK (feedback_type IN ('circuit', 'session')) 
DEFAULT 'session';

ALTER TABLE exercise_feedback
ADD COLUMN IF NOT EXISTS circuit_number integer;

-- Créer un index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_session 
ON exercise_feedback(session_id, feedback_type);