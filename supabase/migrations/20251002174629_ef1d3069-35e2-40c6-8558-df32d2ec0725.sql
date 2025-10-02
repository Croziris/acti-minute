-- Create function to get app_user id from auth user
CREATE OR REPLACE FUNCTION public.get_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM app_user WHERE id = auth.uid()
$$;

-- Drop and recreate program policies with correct logic
DROP POLICY IF EXISTS "Users can view relevant programs" ON public.program;

CREATE POLICY "Clients can view their programs"
ON public.program
FOR SELECT
USING (client_id = get_app_user_id());

CREATE POLICY "Coaches can view their client programs"
ON public.program
FOR SELECT
USING (coach_id = get_app_user_id() OR is_coach());

-- Drop and recreate session policies
DROP POLICY IF EXISTS "Clients can view their own sessions" ON public.session;
DROP POLICY IF EXISTS "Coaches can view their clients sessions" ON public.session;

CREATE POLICY "Clients can view their sessions"
ON public.session
FOR SELECT
USING (client_id = get_app_user_id());

CREATE POLICY "Coaches can view client sessions"
ON public.session
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM program 
  WHERE program.client_id = session.client_id 
  AND program.coach_id = get_app_user_id()
));

-- Update session modification policies
DROP POLICY IF EXISTS "Clients can update their own sessions" ON public.session;
DROP POLICY IF EXISTS "Clients can insert their own sessions" ON public.session;

CREATE POLICY "Clients can update their sessions"
ON public.session
FOR UPDATE
USING (client_id = get_app_user_id());

CREATE POLICY "Clients can insert their sessions"
ON public.session
FOR INSERT
WITH CHECK (client_id = get_app_user_id());

-- Update habit_assignment policies
DROP POLICY IF EXISTS "Clients can view their habit assignments" ON public.habit_assignment;

CREATE POLICY "Clients can view their assignments"
ON public.habit_assignment
FOR SELECT
USING (client_id = get_app_user_id());

-- Update habit_check policies
DROP POLICY IF EXISTS "Clients can view their habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can insert their habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can update their habit checks" ON public.habit_check;
DROP POLICY IF EXISTS "Clients can delete their habit checks" ON public.habit_check;

CREATE POLICY "Clients view habit checks"
ON public.habit_check
FOR SELECT
USING (client_id = get_app_user_id());

CREATE POLICY "Clients insert habit checks"
ON public.habit_check
FOR INSERT
WITH CHECK (client_id = get_app_user_id());

CREATE POLICY "Clients update habit checks"
ON public.habit_check
FOR UPDATE
USING (client_id = get_app_user_id());

CREATE POLICY "Clients delete habit checks"
ON public.habit_check
FOR DELETE
USING (client_id = get_app_user_id());