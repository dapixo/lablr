/**
 * Types partagés pour la gestion des abonnements
 */

/**
 * Type pour la réponse Supabase avec JOIN sur plans
 */
export type SubscriptionWithPlan = {
  subscription_id: string
  customer_id: string | null
  provider: string | null
  status: string
  renews_at: string | null
  ends_at: string | null
  card_brand: string | null
  card_last_four: string | null
  urls: {
    customer_portal?: string | null
    update_payment_method?: string | null
  } | null
  grace_period_starts_at: string | null
  grace_period_ends_at: string | null
  plan: {
    name: string
    price: string
    interval: string
  } | null
}

/**
 * Type pour les données de subscription formatées côté client
 */
export type FormattedSubscription = {
  id: string
  customerId: string | null
  provider: string
  status: string
  statusFormatted: string
  price: string
  interval: string
  planName: string
  isUsageBased: boolean
  renewsAt: string | null
  endsAt: string | null
  trialEndsAt: null
  cardBrand: string | null
  cardLastFour: string | null
  urls: {
    customer_portal: string | null
    update_payment_method: string | null
  }
  isInGracePeriod: boolean
  gracePeriodEndsAt: string | null
  graceDaysRemaining: number
}
