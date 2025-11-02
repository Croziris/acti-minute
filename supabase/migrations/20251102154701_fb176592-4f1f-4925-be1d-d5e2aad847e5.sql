-- Add section column to workout_exercise
ALTER TABLE workout_exercise 
ADD COLUMN IF NOT EXISTS section text 
DEFAULT 'main';

-- Add check constraint for valid sections
ALTER TABLE workout_exercise 
ADD CONSTRAINT workout_exercise_section_check 
CHECK (section IN ('warmup', 'main', 'cooldown'));

-- Update existing exercises to 'main' section
UPDATE workout_exercise 
SET section = 'main' 
WHERE section IS NULL;

-- Create index for optimized queries by section
CREATE INDEX IF NOT EXISTS idx_workout_exercise_section 
ON workout_exercise(workout_id, section, order_index);

-- Comment on column
COMMENT ON COLUMN workout_exercise.section IS 'Section de la séance: warmup (échauffement), main (corps de séance), cooldown (retour au calme)';