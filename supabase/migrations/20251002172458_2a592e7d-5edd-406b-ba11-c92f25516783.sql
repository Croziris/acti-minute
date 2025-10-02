-- Fix article access for all authenticated users
DROP POLICY IF EXISTS "Articles published visible" ON public.article;

CREATE POLICY "All authenticated users can view published articles"
ON public.article
FOR SELECT
TO authenticated
USING (published_at IS NOT NULL AND published_at <= now());