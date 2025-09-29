-- Création des tables pour l'app de coaching sportif

-- Table des credentials (authentification custom sans email)
CREATE TABLE public.credential (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT CHECK (role IN ('spotif.ve','coach')) NOT NULL,
  username TEXT UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL, -- Argon2id hash
  status TEXT DEFAULT 'active' CHECK (status IN ('active','locked','revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Table des utilisateurs app
CREATE TABLE public.app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT CHECK (role IN ('spotif.ve','coach')) NOT NULL,
  credential_id UUID REFERENCES public.credential(id) UNIQUE,
  handle TEXT, -- alias non PII
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des programmes
CREATE TABLE public.program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.app_user(id),
  client_id UUID REFERENCES public.app_user(id),
  titre TEXT,
  objectif TEXT,
  statut TEXT CHECK (statut IN ('draft','published','archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des plans hebdomadaires
CREATE TABLE public.week_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.program(id),
  iso_week INT,
  start_date DATE,
  end_date DATE,
  expected_sessions INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_id, iso_week)
);

-- Table des workouts
CREATE TABLE public.workout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.program(id),
  titre TEXT,
  description TEXT,
  duree_estimee INT, -- en minutes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des exercices
CREATE TABLE public.exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  groupes TEXT[] DEFAULT '{}',
  niveau TEXT,
  materiel TEXT[] DEFAULT '{}',
  video_provider TEXT DEFAULT 'youtube',
  video_id TEXT,
  youtube_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.app_user(id),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des exercices dans un workout
CREATE TABLE public.workout_exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workout(id),
  exercise_id UUID REFERENCES public.exercise(id),
  series INT,
  reps INT,
  temps_seconds INT,
  charge_cible NUMERIC,
  tempo TEXT,
  couleur TEXT,
  tips TEXT,
  variations TEXT,
  order_index INT DEFAULT 0
);

-- Table des sessions
CREATE TABLE public.session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.app_user(id),
  week_plan_id UUID REFERENCES public.week_plan(id),
  workout_id UUID REFERENCES public.workout(id),
  index_num INT, -- 1..N
  date_demarree TIMESTAMPTZ,
  date_terminee TIMESTAMPTZ,
  statut TEXT CHECK (statut IN ('planned','ongoing','done','skipped')) DEFAULT 'planned',
  proof_media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des logs de séries
CREATE TABLE public.set_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session(id),
  exercise_id UUID REFERENCES public.exercise(id),
  index_serie INT,
  reps INT,
  charge NUMERIC,
  rpe NUMERIC, -- Rate of Perceived Exertion
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des feedbacks d'exercices
CREATE TABLE public.exercise_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session(id),
  exercise_id UUID REFERENCES public.exercise(id),
  difficulte_0_10 INT CHECK (difficulte_0_10 BETWEEN 0 AND 10),
  plaisir_0_10 INT CHECK (plaisir_0_10 BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des habitudes
CREATE TABLE public.habit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE,
  titre TEXT,
  description TEXT,
  owner TEXT CHECK (owner IN ('coach','client')) DEFAULT 'coach',
  default_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des assignations d'habitudes
CREATE TABLE public.habit_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.app_user(id),
  habit_id UUID REFERENCES public.habit(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, habit_id)
);

-- Table des checks d'habitudes
CREATE TABLE public.habit_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.app_user(id),
  habit_id UUID REFERENCES public.habit(id),
  date DATE,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, habit_id, date)
);

-- Table des articles
CREATE TABLE public.article (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT,
  slug TEXT UNIQUE,
  categories TEXT[] DEFAULT '{}',
  excerpt TEXT,
  contenu TEXT,
  cover_url TEXT,
  published_at TIMESTAMPTZ,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation de RLS sur toutes les tables
ALTER TABLE public.credential ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
-- Articles : lecture publique si published
CREATE POLICY "Articles published visible" ON public.article
FOR SELECT USING (published_at <= now());

-- Exercices : lecture ouverte, création par coachs
CREATE POLICY "Exercises viewable by all" ON public.exercise
FOR SELECT USING (true);

-- app_user : utilisateur voit seulement ses données
CREATE POLICY "Users see own data" ON public.app_user
FOR ALL USING (id = auth.uid()::uuid);

-- Sessions : clients voient leurs sessions
CREATE POLICY "Clients see own sessions" ON public.session
FOR ALL USING (client_id = auth.uid()::uuid);

-- Set logs : clients voient leurs logs
CREATE POLICY "Clients see own set logs" ON public.set_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.session 
    WHERE session.id = set_log.session_id 
    AND session.client_id = auth.uid()::uuid
  )
);

-- Exercise feedback : clients voient leurs feedbacks
CREATE POLICY "Clients see own exercise feedback" ON public.exercise_feedback
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.session 
    WHERE session.id = exercise_feedback.session_id 
    AND session.client_id = auth.uid()::uuid
  )
);

-- Habit checks : clients voient leurs checks
CREATE POLICY "Clients see own habit checks" ON public.habit_check
FOR ALL USING (client_id = auth.uid()::uuid);

-- Création du bucket de stockage pour les preuves photo
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false);

-- Politique de stockage : clients peuvent uploader leurs preuves
CREATE POLICY "Clients can upload proof photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clients can view their proof photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Insertion de quelques habitudes par défaut
INSERT INTO public.habit (key, titre, description, owner) VALUES
('hydration', 'Hydratation', 'Boire au moins 2L d''eau par jour', 'coach'),
('sleep', 'Sommeil', 'Dormir 7-8h par nuit', 'coach'),
('nutrition', 'Nutrition', 'Respecter son plan alimentaire', 'coach'),
('stretching', 'Étirements', 'Faire 10 minutes d''étirements', 'coach'),
('meditation', 'Méditation', '5 minutes de méditation ou relaxation', 'coach');