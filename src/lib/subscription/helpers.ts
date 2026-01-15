/**
 * Helpers partagés pour la gestion des abonnements
 */

import type { FormattedSubscription, SubscriptionWithPlan } from './types'

/**
 * Calcule le nombre de jours restants jusqu'à une date
 */
export function calculateDaysRemaining(endDate: string): number {
  const now = new Date()
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Traduit le nom du plan en français
 */
export function translatePlanName(name: string | undefined): string {
  if (!name) return 'Inconnu'
  const planNames: Record<string, string> = {
    monthly: 'Mensuel',
    yearly: 'Annuel',
  }
  return planNames[name.toLowerCase()] || name
}

/**
 * Traduit le statut d'abonnement en français avec contexte de période de grâce
 */
export function translateStatus(
  status: string,
  isInPaymentGrace: boolean,
  isInCancelledGrace: boolean,
  daysRemaining: number
): string {
  if (isInPaymentGrace) {
    const plural = daysRemaining > 1 ? 's' : ''
    return `Problème de paiement (${daysRemaining} jour${plural} restant${plural})`
  }
  if (isInCancelledGrace) {
    const plural = daysRemaining > 1 ? 's' : ''
    return `Annulé (accès jusqu'au ${daysRemaining} jour${plural})`
  }

  const statusMap: Record<string, string> = {
    active: 'Actif',
    past_due: 'Paiement en retard',
    unpaid: 'Non payé',
    on_hold: 'En attente de paiement',
    cancelled: 'Annulé',
    expired: 'Expiré',
    pending: 'En attente',
    failed: 'Échec',
  }
  return statusMap[status] || status
}

/**
 * Formate les données de subscription pour l'API
 */
export function formatSubscription(subscriptionData: SubscriptionWithPlan): FormattedSubscription {
  const plan = subscriptionData.plan
  const now = new Date()

  const gracePeriodEndsAt = subscriptionData.grace_period_ends_at
  const isInPaymentGracePeriod = gracePeriodEndsAt !== null && now < new Date(gracePeriodEndsAt)

  const endsAt = subscriptionData.ends_at
  const isInCancelledGracePeriod =
    subscriptionData.status === 'cancelled' && endsAt !== null && now < new Date(endsAt)

  const isInGracePeriod = isInPaymentGracePeriod || isInCancelledGracePeriod

  let graceDaysRemaining = 0
  if (isInPaymentGracePeriod && subscriptionData.grace_period_ends_at) {
    graceDaysRemaining = calculateDaysRemaining(subscriptionData.grace_period_ends_at)
  } else if (isInCancelledGracePeriod && subscriptionData.ends_at) {
    graceDaysRemaining = calculateDaysRemaining(subscriptionData.ends_at)
  }

  const priceInEuros = plan ? (parseInt(plan.price, 10) / 100).toString() : '5'
  const interval = plan?.interval === 'year' ? 'an' : 'mois'

  return {
    id: subscriptionData.subscription_id,
    customerId: subscriptionData.customer_id,
    provider: subscriptionData.provider || 'dodo',
    status: subscriptionData.status,
    statusFormatted: translateStatus(
      subscriptionData.status,
      isInPaymentGracePeriod,
      isInCancelledGracePeriod,
      graceDaysRemaining
    ),
    price: priceInEuros,
    interval,
    planName: translatePlanName(plan?.name),
    isUsageBased: false,
    renewsAt: subscriptionData.renews_at,
    endsAt: subscriptionData.ends_at,
    trialEndsAt: null,
    cardBrand: subscriptionData.card_brand,
    cardLastFour: subscriptionData.card_last_four,
    urls: subscriptionData.urls || {
      customer_portal: null,
      update_payment_method: null,
    },
    isInGracePeriod,
    gracePeriodEndsAt: subscriptionData.grace_period_ends_at,
    graceDaysRemaining,
  }
}

/**
 * Retourne une subscription par défaut (utilisateur Premium sans données)
 */
export function getDefaultSubscription(): { subscription: FormattedSubscription } {
  return {
    subscription: {
      id: 'unknown',
      customerId: null,
      provider: 'dodo',
      status: 'active',
      statusFormatted: 'Active',
      price: '5',
      interval: 'mois',
      planName: 'Unknown',
      isUsageBased: false,
      renewsAt: null,
      endsAt: null,
      trialEndsAt: null,
      cardBrand: null,
      cardLastFour: null,
      urls: {
        customer_portal: null,
        update_payment_method: null,
      },
      isInGracePeriod: false,
      gracePeriodEndsAt: null,
      graceDaysRemaining: 0,
    },
  }
}
