/**
 * Configuration des produits et variants Lemon Squeezy
 */

export const LEMONSQUEEZY_CONFIG = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID || 'test_store',
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'test_webhook_secret',

  // IDs des variants pour les plans d'abonnement
  variants: {
    monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY || 'test_monthly_variant',
    yearly: process.env.LEMONSQUEEZY_VARIANT_YEARLY || 'test_yearly_variant',
  },

  // URLs de redirection après paiement
  redirectUrls: {
    success: process.env.NODE_ENV === 'production'
      ? 'https://lablr.fr/account?success=true'
      : 'http://localhost:3000/account?success=true',
    cancel: process.env.NODE_ENV === 'production'
      ? 'https://lablr.fr/pricing?cancelled=true'
      : 'http://localhost:3000/pricing?cancelled=true',
  }
} as const

/**
 * Plans d'abonnement disponibles
 */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Premium Mensuel',
    price: 5,
    billingCycle: 'monthly',
    variantId: LEMONSQUEEZY_CONFIG.variants.monthly,
  },
  yearly: {
    name: 'Premium Annuel',
    price: 48,
    billingCycle: 'yearly',
    variantId: LEMONSQUEEZY_CONFIG.variants.yearly,
    savings: '20% d\'économie'
  }
} as const

export type PlanType = keyof typeof SUBSCRIPTION_PLANS