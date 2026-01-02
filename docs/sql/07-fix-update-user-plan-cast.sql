-- Fix: Cast explicite TEXT → user_plan dans update_user_plan
-- À exécuter dans Supabase SQL Editor

-- ================================================================
-- PROBLÈME RÉSOLU
-- ================================================================
-- L'erreur "column "plan" is of type user_plan but expression is of type text"
-- était causée par l'absence de cast explicite dans la fonction.
--
-- AVANT: VALUES (p_user_id, p_plan)
-- APRÈS: VALUES (p_user_id, p_plan::user_plan)
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_user_plan(p_user_id uuid, p_plan text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validation
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_plan IS NULL OR p_plan = '' THEN
    RAISE EXCEPTION 'plan is required';
  END IF;

  -- Vérifier que le plan est valide
  IF p_plan NOT IN ('free', 'premium', 'admin') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  -- ✅ FIX: Cast explicite TEXT → user_plan
  INSERT INTO profiles (user_id, plan)
  VALUES (p_user_id, p_plan::user_plan)  -- Cast explicite ajouté
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan = EXCLUDED.plan,
    updated_at = now();

  RETURN true;
END;
$function$;

-- Commentaire mis à jour
COMMENT ON FUNCTION public.update_user_plan IS
'Met à jour le plan utilisateur (free/premium/admin) avec cast automatique TEXT → user_plan';
