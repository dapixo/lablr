/**
 * Handlers pour les événements webhook Dodo Payments
 * Pattern : Handler Map pour éviter la duplication de code
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { PRODUCT_TO_PLAN_MAP } from './config'
import {
  activateSubscription,
  handlePaymentFailure,
  handleCancellation,
  handleExpiration,
  handleRenewal,
  handlePlanChange,
  handleGenericUpdate,
} from './subscription-helpers'

// ================================================================
// TYPES
// ================================================================

export interface WebhookContext {
  supabase: SupabaseClient
  eventName: string
  subscriptionData: WebhookSubscriptionData
}

export interface WebhookSubscriptionData {
  subscription_id: string
  product_id: string
  status: string
  next_billing_date: string | null
  metadata?: Record<string, string> | null
  customer?: {
    customer_id: string
    email: string
    name: string
  }
}

export interface HandlerResult {
  success: boolean
  error?: string
}

type WebhookHandler = (ctx: WebhookContext) => Promise<HandlerResult>

// ================================================================
// CONSTANTES
// ================================================================

/** Messages d'erreur standardisés */
export const WEBHOOK_ERRORS = {
  NO_USER_ID: 'No user_id in metadata',
  NO_CUSTOMER_ID: 'Missing customer_id in webhook payload',
  UNKNOWN_PRODUCT: 'Unknown product_id',
} as const

// ================================================================
// HANDLERS INDIVIDUELS
// ================================================================

/**
 * Handler : subscription.active
 * Action : Upgrade vers Premium + création subscription record
 */
const handleSubscriptionActive: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  const customerId = subscriptionData.customer?.customer_id
  if (!customerId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_CUSTOMER_ID }
  }

  const planId = PRODUCT_TO_PLAN_MAP[subscriptionData.product_id]
  if (!planId) {
    console.error(`[Webhook] Unknown product_id: ${subscriptionData.product_id}`)
  }

  return await activateSubscription(supabase, {
    userId,
    subscriptionId: subscriptionData.subscription_id,
    customerId,
    productId: subscriptionData.product_id,
    planId: planId || null,
    nextBillingDate: subscriptionData.next_billing_date,
    metadata: subscriptionData.metadata || null,
  })
}

/**
 * Handler : subscription.failed
 * Action : Période de grâce 7 jours
 */
const handleSubscriptionFailed: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handlePaymentFailure(supabase, userId, 'failed')
}

/**
 * Handler : subscription.on_hold
 * Action : Période de grâce 7 jours (équivalent past_due)
 */
const handleSubscriptionOnHold: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handlePaymentFailure(supabase, userId, 'on_hold')
}

/**
 * Handler : subscription.cancelled
 * Action : Garder accès jusqu'à next_billing_date
 */
const handleSubscriptionCancelled: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handleCancellation(supabase, userId, subscriptionData.next_billing_date)
}

/**
 * Handler : subscription.expired
 * Action : Rétrogradation vers Free
 */
const handleSubscriptionExpired: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handleExpiration(supabase, userId)
}

/**
 * Handler : subscription.renewed
 * Action : Renouvellement réussi
 */
const handleSubscriptionRenewed: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handleRenewal(supabase, userId, subscriptionData.next_billing_date)
}

/**
 * Handler : subscription.plan_changed
 * Action : Changement de plan (monthly ↔ yearly)
 */
const handleSubscriptionPlanChanged: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handlePlanChange(
    supabase,
    userId,
    subscriptionData.product_id,
    subscriptionData.next_billing_date
  )
}

/**
 * Handler : subscription.updated
 * Action : Mise à jour générique
 */
const handleSubscriptionUpdated: WebhookHandler = async (ctx) => {
  const { supabase, subscriptionData } = ctx
  const userId = subscriptionData.metadata?.user_id

  if (!userId) {
    return { success: false, error: WEBHOOK_ERRORS.NO_USER_ID }
  }

  return await handleGenericUpdate(
    supabase,
    userId,
    subscriptionData.status,
    subscriptionData.next_billing_date,
    subscriptionData.metadata || null
  )
}

// ================================================================
// HANDLER MAP - PATTERN CENTRAL
// ================================================================

/**
 * Map des handlers par event_name
 * Élimine les if/else répétitifs et centralise la logique
 */
export const WEBHOOK_HANDLERS: Record<string, WebhookHandler> = {
  'subscription.active': handleSubscriptionActive,
  'subscription.failed': handleSubscriptionFailed,
  'subscription.on_hold': handleSubscriptionOnHold,
  'subscription.cancelled': handleSubscriptionCancelled,
  'subscription.expired': handleSubscriptionExpired,
  'subscription.renewed': handleSubscriptionRenewed,
  'subscription.plan_changed': handleSubscriptionPlanChanged,
  'subscription.updated': handleSubscriptionUpdated,
}

// ================================================================
// FONCTION PRINCIPALE - DISPATCH
// ================================================================

/**
 * Dispatche un événement webhook vers le bon handler
 * @param ctx Contexte du webhook
 * @returns Résultat du traitement avec succès/erreur
 */
export async function dispatchWebhookEvent(ctx: WebhookContext): Promise<HandlerResult> {
  const handler = WEBHOOK_HANDLERS[ctx.eventName]

  if (!handler) {
    console.log(`ℹ️ Unhandled event: ${ctx.eventName}`)
    return {
      success: true, // Pas d'erreur, juste non-géré
    }
  }

  try {
    return await handler(ctx)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Webhook Handler] Error processing ${ctx.eventName}:`, message)
    return {
      success: false,
      error: `Error processing ${ctx.eventName}: ${message}`,
    }
  }
}

// ================================================================
// FONCTION UTILITAIRE - EXTRACTION USER_ID
// ================================================================

/**
 * Extrait et valide le user_id depuis les métadonnées
 * @param metadata Métadonnées du webhook
 * @returns user_id ou null si absent
 */
export function extractUserId(metadata?: Record<string, string> | null): string | null {
  if (!metadata?.user_id) {
    console.error('[Webhook] Missing user_id in metadata')
    return null
  }

  return metadata.user_id
}

/**
 * Extrait et valide le customer_id depuis l'objet customer
 * @param customer Objet customer du webhook
 * @returns customer_id ou null si absent
 */
export function extractCustomerId(customer?: { customer_id: string } | null): string | null {
  if (!customer?.customer_id) {
    console.error('[Webhook] Missing customer object or customer_id in payload')
    return null
  }

  return customer.customer_id
}
