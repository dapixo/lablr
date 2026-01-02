/**
 * Types TypeScript pour l'intégration Dodo Payments
 */

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'on_hold'
  | 'cancelled'
  | 'paused'
  | 'failed'
  | 'expired'

export interface DodoSubscription {
  subscription_id: string
  customer_id: string
  product_id: string
  status: SubscriptionStatus
  next_billing_date: string
  previous_billing_date: string
  recurring_pre_tax_amount: number
  quantity: number
  payment_frequency_interval: 'day' | 'week' | 'month' | 'year'
  payment_frequency_count: number
  created_at: string
  cancel_at_next_billing_date: boolean
  metadata?: Record<string, string>

  // Informations client
  customer: {
    customer_id: string
    email: string
    name: string
  }

  // Période de grâce pour les échecs de paiement (calculés côté client)
  isInGracePeriod?: boolean
  gracePeriodEndsAt?: string | null
  graceDaysRemaining?: number
}

export interface DodoCustomer {
  customer_id: string
  business_id: string
  email: string
  name: string
  created_at: string
  metadata?: Record<string, string>
  phone_number?: string | null
}

export interface DodoWebhookEvent {
  id: string
  event_name: string
  processed: boolean
  body: string
  processing_error?: string
  created_at: string
  updated_at: string
}

export interface WebhookSubscriptionPayload {
  type: string // Le champ event s'appelle 'type' dans Dodo (ex: "subscription.active")
  business_id: string
  timestamp: string
  data: {
    // Identifiants
    subscription_id: string
    product_id: string
    payment_method_id: string

    // Customer (⚠️ customer_id est dans customer.customer_id, PAS à la racine)
    customer: {
      customer_id: string
      email: string
      name: string
      phone_number: string | null
      metadata: Record<string, string>
    }

    // Status et dates
    status: SubscriptionStatus
    next_billing_date: string
    previous_billing_date: string
    created_at: string
    cancelled_at: string | null
    expires_at: string

    // Pricing
    recurring_pre_tax_amount: number
    quantity: number
    currency: string
    tax_inclusive: boolean
    tax_id: string | null

    // Périodicité
    payment_frequency_interval: string
    payment_frequency_count: number
    subscription_period_interval: string
    subscription_period_count: number

    // Options
    cancel_at_next_billing_date: boolean
    on_demand: boolean
    trial_period_days: number

    // Addons et remises
    addons: unknown[]
    discount_id: string | null
    discount_cycles_remaining: number | null
    meters: unknown[]

    // Billing
    billing: {
      street: string | null
      city: string | null
      state: string | null
      zipcode: string | null
      country: string
    }

    // Métadonnées custom
    metadata?: Record<string, string>
    payload_type: string
  }
}

export interface CheckoutRequest {
  productId: string
  userId: string
  billingCycle: 'monthly' | 'yearly'
}

export interface CheckoutResponse {
  checkoutUrl: string
  subscription_id?: string
  payment_id?: string
}

export interface SubscriptionStatusUpdate {
  subscriptionId: string
  status: SubscriptionStatus
  nextBillingDate?: string | null
  gracePeriodEndsAt?: string | null
}
