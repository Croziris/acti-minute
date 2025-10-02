-- Ajouter les nouveaux champs à la table workout
ALTER TABLE workout ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE workout ADD COLUMN IF NOT EXISTS workout_type TEXT CHECK (workout_type IN ('classic', 'circuit')) DEFAULT 'classic';
ALTER TABLE workout ADD COLUMN IF NOT EXISTS circuit_rounds INT;

-- Ajouter les nouveaux champs à la table workout_exercise
ALTER TABLE workout_exercise ADD COLUMN IF NOT EXISTS temps_repos_seconds INT;
ALTER TABLE workout_exercise ADD COLUMN IF NOT EXISTS rpe_cible NUMERIC;

-- Créer un index pour faciliter les requêtes sur les templates
CREATE INDEX IF NOT EXISTS idx_workout_is_template ON workout(is_template) WHERE is_template = true;

-- Mettre à jour les policies RLS pour les workouts templates
DROP POLICY IF EXISTS "Coaches can insert workouts" ON workout;
CREATE POLICY "Coaches can insert workouts"
ON workout
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE app_user.id = auth.uid() AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches can update workouts" ON workout;
CREATE POLICY "Coaches can update workouts"
ON workout
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE app_user.id = auth.uid() AND app_user.role = 'coach'
  )
);

DROP POLICY IF EXISTS "Coaches and clients can view workouts" ON workout;
CREATE POLICY "Coaches and clients can view workouts"
ON workout
FOR SELECT
TO authenticated
USING (
  -- Les coachs peuvent voir tous les workouts (templates et assignés)
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE app_user.id = auth.uid() AND app_user.role = 'coach'
  )
  OR
  -- Les clients peuvent voir leurs workouts assignés via session
  EXISTS (
    SELECT 1 FROM session 
    WHERE session.workout_id = workout.id 
    AND session.client_id = auth.uid()
  )
);

-- Ajouter une policy pour supprimer les templates
CREATE POLICY "Coaches can delete template workouts"
ON workout
FOR DELETE
TO authenticated
USING (
  is_template = true AND
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE app_user.id = auth.uid() AND app_user.role = 'coach'
  )
);