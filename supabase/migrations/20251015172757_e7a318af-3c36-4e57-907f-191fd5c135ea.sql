-- Ajouter les colonnes pour gérer plusieurs circuits dans une séance
ALTER TABLE workout 
ADD COLUMN nombre_circuits integer DEFAULT 1,
ADD COLUMN circuit_configs jsonb DEFAULT '[{"rounds": 3, "rest": 60}]'::jsonb;

-- Ajouter une colonne pour indiquer à quel circuit appartient un exercice
ALTER TABLE workout_exercise
ADD COLUMN circuit_number integer DEFAULT 1;

-- Mettre à jour les circuits existants pour qu'ils aient la bonne structure
UPDATE workout 
SET circuit_configs = jsonb_build_array(
  jsonb_build_object(
    'rounds', COALESCE(circuit_rounds, 3),
    'rest', COALESCE(temps_repos_tours_seconds, 60)
  )
)
WHERE workout_type = 'circuit' AND circuit_configs IS NULL;

COMMENT ON COLUMN workout.nombre_circuits IS 'Nombre de circuits distincts dans la séance (1, 2, 3 ou plus)';
COMMENT ON COLUMN workout.circuit_configs IS 'Configuration JSON de chaque circuit: [{rounds: 3, rest: 60}, {rounds: 4, rest: 90}]';
COMMENT ON COLUMN workout_exercise.circuit_number IS 'Numéro du circuit auquel appartient cet exercice (1, 2, 3, etc.)';