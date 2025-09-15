-- Trigger pour créer automatiquement un profil lors de l'inscription
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, plan)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger qui s'exécute à chaque nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Créer un profil pour les utilisateurs existants (si il y en a)
INSERT INTO public.profiles (user_id, plan)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);