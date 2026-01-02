/**
 * Configuration des produits et paramètres Dodo Payments
 */

export const DODO_CONFIG = {
  brandId: process.env.DODO_BRAND_ID || '',
  webhookSecret: process.env.DODO_WEBHOOK_SECRET || '',

  // IDs des produits pour les plans d'abonnement
  products: {
    monthly: process.env.DODO_PRODUCT_MONTHLY || '',
    yearly: process.env.DODO_PRODUCT_YEARLY || '',
  },

  // URLs de redirection après paiement
  redirectUrls: {
    success:
      process.env.NODE_ENV === 'production'
        ? 'https://lalabel.app/account?success=true'
        : 'http://localhost:3000/account?success=true',
    cancel:
      process.env.NODE_ENV === 'production'
        ? 'https://lalabel.app/pricing?cancelled=true'
        : 'http://localhost:3000/pricing?cancelled=true',
  },
} as const

/**
 * Plans d'abonnement disponibles
 */
/**
 * IDs des plans Supabase (référence table plans)
 */
export const PLAN_IDS = {
  monthly: process.env.SUPABASE_PLAN_MONTHLY_ID || '',
  yearly: process.env.SUPABASE_PLAN_YEARLY_ID || '',
} as const

export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Premium Mensuel',
    price: 6,
    billingCycle: 'monthly',
    productId: DODO_CONFIG.products.monthly,
    planId: PLAN_IDS.monthly,
  },
  yearly: {
    name: 'Premium Annuel',
    price: 48,
    billingCycle: 'yearly',
    productId: DODO_CONFIG.products.yearly,
    planId: PLAN_IDS.yearly,
    savings: "33% d'économie",
  },
} as const

export type PlanType = keyof typeof SUBSCRIPTION_PLANS

/**
 * Mapping Dodo product_id → Supabase plan_id
 * Utilisé par le webhook handler pour peupler subscriptions.plan_id
 */
export const PRODUCT_TO_PLAN_MAP: Record<string, string> = {
  [DODO_CONFIG.products.monthly]: PLAN_IDS.monthly,
  [DODO_CONFIG.products.yearly]: PLAN_IDS.yearly,
}
