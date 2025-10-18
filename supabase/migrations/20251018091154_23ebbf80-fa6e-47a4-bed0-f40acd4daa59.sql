-- Add commentaire_fin column to session table
ALTER TABLE public.session 
ADD COLUMN commentaire_fin text;