-- Créer une table pour sauvegarder la progression des circuits
CREATE TABLE IF NOT EXISTS circuit_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  circuit_number integer NOT NULL,
  completed_rounds integer NOT NULL DEFAULT 0,
  exercise_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id, circuit_number)
);

-- RLS : Clients voient leur propre progression
ALTER TABLE circuit_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their circuit progress"
ON circuit_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = circuit_progress.session_id
    AND session.client_id = get_app_user_id()
  )
);

CREATE POLICY "Clients can manage their circuit progress"
ON circuit_progress
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = circuit_progress.session_id
    AND session.client_id = get_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = circuit_progress.session_id
    AND session.client_id = get_app_user_id()
  )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_circuit_progress_session 
ON circuit_progress(session_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_circuit_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER circuit_progress_updated_at
BEFORE UPDATE ON circuit_progress
FOR EACH ROW
EXECUTE FUNCTION update_circuit_progress_timestamp();

-- Ajouter colonne phone pour WhatsApp dans app_user
ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS phone text;