-- Ajouter une colonne session_type à la table workout
ALTER TABLE workout 
ADD COLUMN IF NOT EXISTS session_type text 
CHECK (session_type IN ('warmup', 'main', 'cooldown')) 
DEFAULT 'main';

-- Mettre à jour tous les workouts existants (par défaut 'main')
UPDATE workout 
SET session_type = 'main' 
WHERE session_type IS NULL;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_workout_session_type 
ON workout(session_type);

-- Commentaires pour documentation
COMMENT ON COLUMN workout.session_type IS 'Type de séance: warmup (échauffement), main (principale), cooldown (retour au calme)';

-- Supprimer la colonne section de workout_exercise (ancienne approche)
ALTER TABLE workout_exercise DROP COLUMN IF EXISTS section;