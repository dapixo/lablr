/**
 * Types TypeScript pour l'intégration Lemon Squeezy
 */

export interface LemonSqueezySubscription {
  id: string
  lemonSqueezyId: string
  userId: string
  orderId: number
  name: string
  email: string
  status: SubscriptionStatus
  statusFormatted: string
  renewsAt: string | null
  endsAt: string | null
  trialEndsAt: string | null
  price: string
  interval: string
  planName: string
  isPaused: boolean
  subscriptionItemId: number
  isUsageBased: boolean
  planId: string
  variantId: number
  productId: number
  customerId: number
  cardBrand?: string
  cardLastFour?: string
  urls: {
    customer_portal_update_subscription?: string
    customer_portal?: string
    update_payment_method?: string
  }
  // Période de grâce pour les échecs de paiement
  isInGracePeriod?: boolean
  gracePeriodEndsAt?: string | null
  graceDaysRemaining?: number
  createdAt: string
  updatedAt: string
}

export type SubscriptionStatus =
  | 'on_trial'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'
  | 'expired'

export interface LemonSqueezyPlan {
  id: string
  variantId: number
  productId: number
  name: string
  description?: string
  price: string
  billingCycle: 'monthly' | 'yearly'
  trialDays?: number
  isActive: boolean
}

export interface LemonSqueezyWebhookEvent {
  id: string
  eventName: string
  processed: boolean
  body: string
  processingError?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookSubscriptionPayload {
  meta: {
    event_name: string
    custom_data?: {
      user_id: string
    }
  }
  data: {
    type: 'subscriptions'
    id: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      order_item_id: number
      product_id: number
      variant_id: number
      product_name: string
      variant_name: string
      user_name: string
      user_email: string
      status: SubscriptionStatus
      status_formatted: string
      card_brand?: string
      card_last_four?: string
      payment_processor?: string
      pause: unknown
      cancelled: boolean
      trial_ends_at: string | null
      billing_anchor: number
      first_subscription_item: {
        id: number
        subscription_id: number
        price_id: number
        quantity: number
        is_usage_based: boolean
        created_at: string
        updated_at: string
      }
      urls: {
        update_payment_method?: string
        customer_portal?: string
        customer_portal_update_subscription?: string
      }
      renews_at: string | null
      ends_at: string | null
      created_at: string
      updated_at: string
      test_mode: boolean
    }
  }
}

export interface CheckoutRequest {
  variantId: string
  userId: string
  billingCycle: 'monthly' | 'yearly'
}

export interface CheckoutResponse {
  checkoutUrl: string
}

export interface SubscriptionStatusUpdate {
  subscriptionId: string
  status: SubscriptionStatus
  endsAt?: string | null
  renewsAt?: string | null
}
