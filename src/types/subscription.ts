/**
 * Types pour les abonnements Dodo Payments
 */

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'on_hold'
  | 'cancelled'
  | 'paused'
  | 'expired'
  | 'failed'

/**
 * Interface pour les abonnements Dodo Payments
 */
export interface Subscription {
  id: string
  customerId: string | null
  provider: 'dodo'
  status: SubscriptionStatus
  statusFormatted: string

  // Informations du plan
  planName: string
  price: string
  interval: string
  isUsageBased: boolean

  // Dates
  renewsAt: string | null
  endsAt: string | null
  trialEndsAt: string | null

  // Informations de paiement
  cardBrand?: string | null
  cardLastFour?: string | null

  // URLs customer portal
  urls: {
    customer_portal?: string | null
    update_payment_method?: string | null
  }

  // Période de grâce (7 jours pour échecs de paiement)
  isInGracePeriod?: boolean
  gracePeriodEndsAt?: string | null
  graceDaysRemaining?: number
}
