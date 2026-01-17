/**
 * Helpers pour la gestion des subscriptions expirées
 * ⚡ Fonctions pures pour faciliter les tests unitaires
 */

import { debugLog } from './debug'

/**
 * Type pour une subscription récupérée de la DB
 */
export interface SubscriptionData {
  subscription_id: string
  status: string
  ends_at: string | null
  grace_period_ends_at: string | null
}

/**
 * Type pour une subscription expirée avec sa raison
 */
export interface ExpiredSubscription {
  subscription_id: string
  reason: string
}

/**
 * Détermine si une subscription est expirée
 * ⚡ Fonction pure - pas d'effets de bord
 *
 * @param sub - Données de la subscription
 * @param now - Date actuelle (injectable pour tests)
 * @returns Objet avec isExpired et raison, ou null si pas expirée
 */
export function checkSubscriptionExpiration(
  sub: SubscriptionData,
  now: Date = new Date()
): ExpiredSubscription | null {
  // Cas 1: Période de grâce expirée (past_due/unpaid)
  if (sub.grace_period_ends_at && new Date(sub.grace_period_ends_at) < now) {
    return {
      subscription_id: sub.subscription_id,
      reason: `Grace period expired (${sub.grace_period_ends_at})`,
    }
  }

  // Cas 2: Subscription annulée et ends_at passé
  if (sub.status === 'cancelled' && sub.ends_at && new Date(sub.ends_at) < now) {
    return {
      subscription_id: sub.subscription_id,
      reason: `Cancelled subscription ended (${sub.ends_at})`,
    }
  }

  // Cas 3: Subscription en pause et période payée expirée
  if (sub.status === 'paused' && sub.ends_at && new Date(sub.ends_at) < now) {
    return {
      subscription_id: sub.subscription_id,
      reason: `Paused subscription period ended (${sub.ends_at})`,
    }
  }

  return null
}

/**
 * Trouve toutes les subscriptions expirées dans une liste
 * ⚡ Fonction pure - pas d'effets de bord
 *
 * @param subscriptions - Liste des subscriptions à vérifier
 * @param now - Date actuelle (injectable pour tests)
 * @returns Liste des subscriptions expirées avec leurs raisons
 */
export function findExpiredSubscriptions(
  subscriptions: SubscriptionData[],
  now: Date = new Date()
): ExpiredSubscription[] {
  const expired: ExpiredSubscription[] = []

  for (const sub of subscriptions) {
    const expiredSub = checkSubscriptionExpiration(sub, now)
    if (expiredSub) {
      debugLog(`⏰ Subscription ${expiredSub.subscription_id} expired: ${expiredSub.reason}`)
      expired.push(expiredSub)
    }
  }

  return expired
}

/**
 * Vérifie si le cache de vérification d'expiration est toujours valide
 * ⚡ Fonction pure - pas d'effets de bord
 *
 * @param lastCheck - Timestamp de la dernière vérification (ms)
 * @param now - Timestamp actuel (ms)
 * @param ttl - Durée de validité du cache (ms)
 * @returns true si le cache est valide (skip la vérification)
 */
export function shouldSkipExpirationCheck(
  lastCheck: number | undefined,
  now: number,
  ttl: number
): boolean {
  return lastCheck !== undefined && now - lastCheck < ttl
}
