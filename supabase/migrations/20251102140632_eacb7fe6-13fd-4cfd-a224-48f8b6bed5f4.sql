-- Table pour sauvegarder la progression des séances classiques
CREATE TABLE IF NOT EXISTS classic_session_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  completed_exercises jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_classic_progress_session 
ON classic_session_progress(session_id);

-- RLS Policies - Les clients peuvent gérer leur propre progression
ALTER TABLE classic_session_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their classic session progress"
ON classic_session_progress
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = classic_session_progress.session_id
    AND session.client_id = get_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session
    WHERE session.id = classic_session_progress.session_id
    AND session.client_id = get_app_user_id()
  )
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_classic_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classic_progress_updated_at
BEFORE UPDATE ON classic_session_progress
FOR EACH ROW
EXECUTE FUNCTION update_classic_progress_timestamp();