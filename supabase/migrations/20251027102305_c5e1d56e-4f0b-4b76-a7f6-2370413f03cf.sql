-- Create enum for routine types
CREATE TYPE routine_type AS ENUM ('exercises', 'video');

-- Create routines table
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type routine_type NOT NULL DEFAULT 'exercises',
  video_url TEXT,
  tips JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create routine_exercises junction table
CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client_routines assignment table
CREATE TABLE public.client_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(routine_id, client_id)
);

-- Create routine_tracking table for weekly check-ins
CREATE TABLE public.routine_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, routine_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines
CREATE POLICY "Coaches can manage their routines"
  ON public.routines
  FOR ALL
  USING (coach_id = get_app_user_id() AND is_coach())
  WITH CHECK (coach_id = get_app_user_id() AND is_coach());

CREATE POLICY "Clients can view assigned routines"
  ON public.routines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_routines
      WHERE client_routines.routine_id = routines.id
        AND client_routines.client_id = get_app_user_id()
        AND client_routines.active = true
    )
  );

-- RLS Policies for routine_exercises
CREATE POLICY "Coaches can manage routine exercises"
  ON public.routine_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
        AND routines.coach_id = get_app_user_id()
    ) AND is_coach()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
        AND routines.coach_id = get_app_user_id()
    ) AND is_coach()
  );

CREATE POLICY "Clients can view exercises of assigned routines"
  ON public.routine_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_routines
      WHERE client_routines.routine_id = routine_exercises.routine_id
        AND client_routines.client_id = get_app_user_id()
        AND client_routines.active = true
    )
  );

-- RLS Policies for client_routines
CREATE POLICY "Coaches can manage client routine assignments"
  ON public.client_routines
  FOR ALL
  USING (assigned_by = get_app_user_id() AND is_coach())
  WITH CHECK (assigned_by = get_app_user_id() AND is_coach());

CREATE POLICY "Clients can view their assigned routines"
  ON public.client_routines
  FOR SELECT
  USING (client_id = get_app_user_id() AND is_client());

-- RLS Policies for routine_tracking
CREATE POLICY "Clients can manage their routine tracking"
  ON public.routine_tracking
  FOR ALL
  USING (client_id = get_app_user_id() AND is_client())
  WITH CHECK (client_id = get_app_user_id() AND is_client());

CREATE POLICY "Coaches can view client routine tracking"
  ON public.routine_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program
      WHERE program.client_id = routine_tracking.client_id
        AND program.coach_id = get_app_user_id()
    ) AND is_coach()
  );

-- Create indexes for better performance
CREATE INDEX idx_routines_coach_id ON public.routines(coach_id);
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX idx_client_routines_client_id ON public.client_routines(client_id);
CREATE INDEX idx_client_routines_routine_id ON public.client_routines(routine_id);
CREATE INDEX idx_routine_tracking_client_date ON public.routine_tracking(client_id, date);
CREATE INDEX idx_routine_tracking_routine_id ON public.routine_tracking(routine_id);