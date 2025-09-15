-- Création complète de la table profiles pour LABLR
-- À exécuter dans Supabase SQL Editor

-- 1. Créer le type ENUM pour les plans
CREATE TYPE user_plan AS ENUM ('free', 'premium');

-- 2. Créer la table profiles
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan user_plan DEFAULT 'free' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Créer l'index pour optimiser les requêtes Premium
CREATE INDEX idx_profiles_premium_users
ON profiles(plan, user_id)
WHERE plan = 'premium';

-- 4. Créer un index sur user_id pour les jointures
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 5. Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour la sécurité
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Commentaires pour documentation
COMMENT ON TABLE profiles IS 'Profils utilisateur avec informations de plan';
COMMENT ON COLUMN profiles.user_id IS 'Référence vers auth.users';
COMMENT ON COLUMN profiles.plan IS 'Plan utilisateur: free ou premium';
COMMENT ON COLUMN profiles.created_at IS 'Date de création du profil';
COMMENT ON COLUMN profiles.updated_at IS 'Date de dernière modification';