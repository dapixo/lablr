import DodoPayments from 'dodopayments'

/**
 * Configuration du SDK Dodo Payments avec la clé API
 */
export function setupDodoPayments() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY

  if (!apiKey) {
    throw new Error('DODO_PAYMENTS_API_KEY environment variable is required')
  }

  // Détecter l'environnement via variable dédiée ou NODE_ENV
  const isTestMode =
    process.env.DODO_TEST_MODE === 'true' ||
    process.env.NODE_ENV === 'development'

  console.log('[Dodo Client] Test mode:', isTestMode)
  console.log('[Dodo Client] Environment:', isTestMode ? 'test_mode' : 'live_mode')

  return new DodoPayments({
    bearerToken: apiKey,
    environment: isTestMode ? 'test_mode' : 'live_mode',
  })
}

/**
 * Vérifie que toutes les variables d'environnement Dodo Payments sont présentes
 */
export function validateDodoConfig(): boolean {
  const requiredVars = [
    'DODO_PAYMENTS_API_KEY',
    'DODO_BRAND_ID',
    'DODO_WEBHOOK_SECRET',
    'DODO_PRODUCT_MONTHLY',
    'DODO_PRODUCT_YEARLY',
    'SUPABASE_PLAN_MONTHLY_ID',
    'SUPABASE_PLAN_YEARLY_ID',
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`)
      return false
    }
  }

  return true
}
