# Scripts SQL pour la Gestion des Plans Utilisateur

Ce dossier contient les scripts SQL nécessaires pour configurer le système de plans utilisateur (free/premium) dans Supabase.

## Ordre d'exécution

### 1. Création de la table profiles
```bash
# Exécuter dans Supabase SQL Editor
docs/sql/01-create-profiles-table.sql
```

Crée :
- Type ENUM `user_plan` (free/premium)
- Table `profiles` avec RLS activé
- Index optimisé pour les utilisateurs Premium
- Politiques de sécurité

### 2. Trigger d'auto-création de profils
```bash
# Exécuter dans Supabase SQL Editor
docs/sql/02-auto-create-profile-trigger.sql
```

Crée :
- Fonction `handle_new_user()`
- Trigger automatique sur `auth.users`
- Profils pour utilisateurs existants

## Fonctionnalités

- ✅ **Types sûrs** : ENUM PostgreSQL pour les plans
- ✅ **Sécurité** : Row Level Security (RLS) activé
- ✅ **Performance** : Index partiel pour utilisateurs Premium
- ✅ **Automatisation** : Profils créés automatiquement
- ✅ **Idempotence** : Scripts réexécutables sans risque

## Vérification

Pour vérifier que tout fonctionne :

```sql
-- Voir tous les profils
SELECT user_id, plan, created_at FROM profiles;

-- Vérifier les politiques RLS
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
```