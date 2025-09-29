-- Insertion de données de test pour l'authentification
-- Credentials de test
INSERT INTO public.credential (role, username, secret_hash, status) VALUES
('spotif.ve', 'alice', 'demo_hash_sportive', 'active'),
('coach', 'coach_jean', 'demo_hash_coach', 'active'),
('spotif.ve', 'bob', 'demo_hash_sportif', 'active');

-- Utilisateurs app correspondants
INSERT INTO public.app_user (role, credential_id, handle) VALUES
('spotif.ve', (SELECT id FROM public.credential WHERE username = 'alice'), 'Alice'),
('coach', (SELECT id FROM public.credential WHERE username = 'coach_jean'), 'Coach Jean'),
('spotif.ve', (SELECT id FROM public.credential WHERE username = 'bob'), 'Bob');

-- Quelques articles de démonstration
INSERT INTO public.article (titre, slug, categories, excerpt, contenu, published_at, author) VALUES
('Les bienfaits de l''hydratation', 'bienfaits-hydratation', ARRAY['nutrition', 'santé'], 
 'Découvrez pourquoi boire suffisamment d''eau est crucial pour vos performances sportives.',
 'L''hydratation joue un rôle crucial dans vos performances sportives...', 
 now() - interval '1 day', 'Dr. Martin'),
 
('Comment bien s''échauffer', 'comment-bien-s-echauffer', ARRAY['entraînement', 'prévention'],
 'Un bon échauffement peut prévenir les blessures et améliorer vos performances.',
 'L''échauffement est une étape fondamentale de tout entraînement...', 
 now() - interval '2 days', 'Coach Jean'),
 
('Nutrition post-entraînement', 'nutrition-post-entrainement', ARRAY['nutrition', 'récupération'],
 'Que manger après l''entraînement pour optimiser votre récupération.',
 'La période post-entraînement est cruciale pour la récupération...', 
 now() - interval '3 days', 'Nutritionniste Sophie');