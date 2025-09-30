/**
 * Helper pour la validation sécurisée des variables d'environnement
 * Remplace les assertions dangereuses (!!) par une validation appropriée
 */

interface EnvValidationError extends Error {
  missingVars: string[]
}

/**
 * Valide qu'une variable d'environnement existe et n'est pas vide
 */
export function validateEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Variable d'environnement manquante ou vide: ${name}`)
  }
  return value
}

/**
 * Valide plusieurs variables d'environnement en une fois
 */
export function validateEnvVars(vars: Record<string, string | undefined>): Record<string, string> {
  const missingVars: string[] = []
  const validatedVars: Record<string, string> = {}

  for (const [name, value] of Object.entries(vars)) {
    if (!value || value.trim() === '') {
      missingVars.push(name)
    } else {
      validatedVars[name] = value
    }
  }

  if (missingVars.length > 0) {
    const error = new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`) as EnvValidationError
    error.missingVars = missingVars
    throw error
  }

  return validatedVars
}

/**
 * Validation spécifique pour les variables Supabase côté client
 */
export function validateSupabaseClientEnv() {
  return validateEnvVars({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
}

/**
 * Validation spécifique pour les variables Supabase côté serveur
 */
export function validateSupabaseServerEnv() {
  return validateEnvVars({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

/**
 * Validation spécifique pour les variables Lemon Squeezy
 */
export function validateLemonSqueezyEnv() {
  return validateEnvVars({
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
  })
}