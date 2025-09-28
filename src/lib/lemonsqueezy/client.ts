import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

/**
 * Configuration du SDK Lemon Squeezy avec la clé API
 */
export function setupLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY

  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY environment variable is required')
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error('Lemon Squeezy API Error:', error)
    },
  })
}

/**
 * Vérifie que toutes les variables d'environnement Lemon Squeezy sont présentes
 */
export function validateLemonSqueezyConfig(): boolean {
  const requiredVars = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`)
      return false
    }
  }

  return true
}
