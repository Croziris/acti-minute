-- Fix habit_check policies for clients
DROP POLICY IF EXISTS "Clients see own habit checks" ON public.habit_check;

CREATE POLICY "Clients can view their habit checks"
ON public.habit_check
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can insert their habit checks"
ON public.habit_check
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their habit checks"
ON public.habit_check
FOR UPDATE
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can delete their habit checks"
ON public.habit_check
FOR DELETE
TO authenticated
USING (client_id = auth.uid());