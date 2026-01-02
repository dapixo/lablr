/**
 * Helpers pour la gestion des subscriptions Dodo Payments
 * Centralise la logique métier pour éviter la duplication
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ================================================================
// CONSTANTES
// ================================================================

/** Durée de la période de grâce en jours (best practice Dodo Payments) */
export const GRACE_PERIOD_DAYS = 7

/** Durée de la fenêtre de tolérance pour les webhooks en secondes */
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60 // 5 minutes

// ================================================================
// TYPES
// ================================================================

export interface GracePeriod {
  startsAt: string
  endsAt: string
  daysRemaining: number
  isInGracePeriod: boolean
}

export interface SubscriptionUpdateParams {
  userId: string
  status?: string
  renewsAt?: string | null
  endsAt?: string | null
  gracePeriodStartsAt?: string | null
  gracePeriodEndsAt?: string | null
  productId?: string
  metadata?: Record<string, unknown> | null
}

// ================================================================
// FONCTIONS UTILITAIRES - PÉRIODE DE GRÂCE
// ================================================================

/**
 * Calcule la période de grâce (7 jours) à partir de maintenant
 * @returns Objet contenant les dates de début et fin de période de grâce
 */
export function calculateGracePeriod(): GracePeriod {
  const now = new Date()
  const startsAt = now.toISOString()
  const endsAt = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()

  return {
    startsAt,
    endsAt,
    daysRemaining: GRACE_PERIOD_DAYS,
    isInGracePeriod: true,
  }
}

/**
 * Calcule les jours restants dans une période de grâce
 * @param gracePeriodEndsAt Date de fin de la période de grâce (ISO string)
 * @returns Nombre de jours restants (arrondi à l'entier inférieur)
 */
export function calculateDaysRemaining(gracePeriodEndsAt: string): number {
  const now = new Date()
  const endsAt = new Date(gracePeriodEndsAt)
  const diffMs = endsAt.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Vérifie si une date est encore dans le futur
 * @param dateString Date à vérifier (ISO string)
 * @returns true si la date est dans le futur
 */
export function isInFuture(dateString: string | null): boolean {
  if (!dateString) return false

  const date = new Date(dateString)
  const now = new Date()

  return date > now
}

// ================================================================
// FONCTIONS RPC - SUPABASE SECURITY DEFINER
// ================================================================

/**
 * Upsert d'une subscription via RPC (bypass RLS de manière sécurisée)
 */
export async function upsertSubscriptionRPC(
  supabase: SupabaseClient,
  params: {
    userId: string
    subscriptionId: string
    customerId: string
    productId: string
    planId: string | null
    status: string
    renewsAt?: string | null
    endsAt?: string | null
    gracePeriodStartsAt?: string | null
    gracePeriodEndsAt?: string | null
    metadata?: Record<string, unknown> | null
  }
) {
  const { data, error } = await supabase.rpc('upsert_subscription', {
    p_user_id: params.userId,
    p_subscription_id: params.subscriptionId,
    p_customer_id: params.customerId,
    p_product_id: params.productId,
    p_plan_id: params.planId,
    p_status: params.status,
    p_renews_at: params.renewsAt || null,
    p_ends_at: params.endsAt || null,
    p_grace_period_starts_at: params.gracePeriodStartsAt || null,
    p_grace_period_ends_at: params.gracePeriodEndsAt || null,
    p_metadata: params.metadata || null,
  })

  if (error) {
    console.error('[Subscription RPC] Upsert error:', error)
    throw error
  }

  return data
}

/**
 * Met à jour une subscription existante via RPC
 */
export async function updateSubscriptionRPC(
  supabase: SupabaseClient,
  params: SubscriptionUpdateParams
) {
  const { data, error } = await supabase.rpc('update_subscription', {
    p_user_id: params.userId,
    p_status: params.status || null,
    p_renews_at: params.renewsAt !== undefined ? params.renewsAt : null,
    p_ends_at: params.endsAt !== undefined ? params.endsAt : null,
    p_grace_period_starts_at: params.gracePeriodStartsAt !== undefined ? params.gracePeriodStartsAt : null,
    p_grace_period_ends_at: params.gracePeriodEndsAt !== undefined ? params.gracePeriodEndsAt : null,
    p_product_id: params.productId || null,
    p_metadata: params.metadata !== undefined ? params.metadata : null,
  })

  if (error) {
    console.error('[Subscription RPC] Update error:', error)
    throw error
  }

  return data
}

/**
 * Met à jour le plan d'un utilisateur via RPC
 */
export async function updateUserPlanRPC(
  supabase: SupabaseClient,
  userId: string,
  plan: 'free' | 'premium'
) {
  const { data, error } = await supabase.rpc('update_user_plan', {
    p_user_id: userId,
    p_plan: plan,
  })

  if (error) {
    console.error('[User Plan RPC] Update error:', error)
    throw error
  }

  return data
}

// ================================================================
// FONCTIONS MÉTIER - LOGIQUE SUBSCRIPTION
// ================================================================

/**
 * Active une subscription (upgrade vers Premium)
 */
export async function activateSubscription(
  supabase: SupabaseClient,
  params: {
    userId: string
    subscriptionId: string
    customerId: string
    productId: string
    planId: string | null
    nextBillingDate: string | null
    metadata: Record<string, unknown> | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`✅ Activating subscription for user ${params.userId}`)

    // 1. Upgrade vers Premium
    await updateUserPlanRPC(supabase, params.userId, 'premium')
    console.log(`✅ User ${params.userId} upgraded to Premium`)

    // 2. Créer/mettre à jour la subscription
    await upsertSubscriptionRPC(supabase, {
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      productId: params.productId,
      planId: params.planId,
      status: 'active',
      renewsAt: params.nextBillingDate,
      endsAt: null,
      gracePeriodStartsAt: null,
      gracePeriodEndsAt: null,
      metadata: params.metadata,
    })

    console.log(`✅ Subscription record created for user ${params.userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Activate Subscription] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère un échec de paiement (période de grâce 7 jours)
 */
export async function handlePaymentFailure(
  supabase: SupabaseClient,
  userId: string,
  status: 'failed' | 'on_hold'
): Promise<{ success: boolean; error?: string }> {
  try {
    const gracePeriod = calculateGracePeriod()

    console.log(`⚠️ Payment ${status} for user ${userId}`)
    console.log(`🕐 Grace period until: ${gracePeriod.endsAt}`)

    // L'utilisateur RESTE Premium pendant la période de grâce
    await updateSubscriptionRPC(supabase, {
      userId,
      status,
      gracePeriodStartsAt: gracePeriod.startsAt,
      gracePeriodEndsAt: gracePeriod.endsAt,
    })

    console.log(`✅ Grace period set for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Payment Failure] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère une annulation (accès jusqu'à next_billing_date)
 */
export async function handleCancellation(
  supabase: SupabaseClient,
  userId: string,
  nextBillingDate: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📋 Subscription cancelled for user ${userId}`)
    console.log(`Access until: ${nextBillingDate}`)

    // L'utilisateur reste Premium jusqu'à next_billing_date
    await updateSubscriptionRPC(supabase, {
      userId,
      status: 'cancelled',
      endsAt: nextBillingDate,
    })

    console.log(`✅ Cancellation recorded for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Cancellation] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère une expiration (rétrogradation vers Free)
 */
export async function handleExpiration(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`⏰ Subscription expired for user ${userId}, downgrading to Free`)

    // 1. Rétrograder vers Free
    await updateUserPlanRPC(supabase, userId, 'free')
    console.log(`⬇️ User ${userId} downgraded to Free`)

    // 2. Mettre à jour le statut
    await updateSubscriptionRPC(supabase, {
      userId,
      status: 'expired',
    })

    console.log(`✅ Expiration processed for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Expiration] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère un renouvellement réussi
 */
export async function handleRenewal(
  supabase: SupabaseClient,
  userId: string,
  nextBillingDate: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`✅ Subscription renewed for user ${userId}`)

    await updateSubscriptionRPC(supabase, {
      userId,
      status: 'active',
      renewsAt: nextBillingDate,
      gracePeriodStartsAt: null,
      gracePeriodEndsAt: null,
    })

    console.log(`✅ Renewal processed for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Renewal] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère un changement de plan
 */
export async function handlePlanChange(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  nextBillingDate: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 Plan changed for user ${userId}`)

    await updateSubscriptionRPC(supabase, {
      userId,
      productId,
      renewsAt: nextBillingDate,
    })

    console.log(`✅ Plan change processed for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Plan Change] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Gère une mise à jour générique
 */
export async function handleGenericUpdate(
  supabase: SupabaseClient,
  userId: string,
  status: string,
  nextBillingDate: string | null,
  metadata: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 Subscription updated for user ${userId}`)

    await updateSubscriptionRPC(supabase, {
      userId,
      status,
      renewsAt: nextBillingDate,
      metadata,
    })

    console.log(`✅ Generic update processed for user ${userId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Generic Update] Error:', message)
    return { success: false, error: message }
  }
}
