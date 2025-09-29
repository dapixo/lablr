import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Récupération des données d'abonnement utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vérifier d'abord le plan dans profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (profile?.plan !== 'premium') {
      // Utilisateur free, pas d'abonnement
      return NextResponse.json({ subscription: null })
    }

    // Récupérer les infos de l'abonnement (incluant ceux en période de grâce)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        lemon_squeezy_id,
        status,
        variant_id,
        renews_at,
        ends_at,
        card_brand,
        card_last_four,
        urls,
        plan_id,
        grace_period_starts_at,
        grace_period_ends_at
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due', 'unpaid', 'cancelled', 'paused']) // Inclure tous les statuts avec accès
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() // Évite l'erreur si 0 ou multiple résultats

    if (subscriptionError || !subscription) {
      console.error('Subscription query error:', subscriptionError)
      // Utilisateur Premium mais pas d'abonnement trouvé
      return NextResponse.json({
        subscription: {
          id: 'unknown',
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
        },
      })
    }

    // Récupérer séparément les infos du plan
    const { data: plan } = await supabase
      .from('plans')
      .select('name, price, interval')
      .eq('id', subscription.plan_id)
      .single()

    // Vérifier si l'utilisateur est en période de grâce
    const isInPaymentGracePeriod =
      subscription.grace_period_ends_at && new Date() < new Date(subscription.grace_period_ends_at)

    const isInCancelledGracePeriod =
      subscription.status === 'cancelled' &&
      subscription.ends_at &&
      new Date() < new Date(subscription.ends_at)

    const isInGracePeriod = isInPaymentGracePeriod || isInCancelledGracePeriod

    // Calculer les jours restants selon le type de grâce
    let graceDaysRemaining = 0
    if (isInPaymentGracePeriod && subscription.grace_period_ends_at) {
      const now = new Date()
      const graceEnd = new Date(subscription.grace_period_ends_at)
      graceDaysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else if (isInCancelledGracePeriod && subscription.ends_at) {
      const now = new Date()
      const graceEnd = new Date(subscription.ends_at)
      graceDaysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Traiter les infos du plan
    const priceInEuros = plan ? (parseInt(plan.price) / 100).toString() : '5'
    const interval = plan?.interval === 'year' ? 'an' : 'mois'

    // Traduire le nom du plan
    const translatePlanName = (name: string | undefined) => {
      if (!name) return 'Inconnu'
      switch (name.toLowerCase()) {
        case 'monthly':
          return 'Mensuel'
        case 'yearly':
          return 'Annuel'
        default:
          return name
      }
    }

    // Traduire le statut avec info période de grâce
    const translateStatus = (status: string) => {
      if (isInPaymentGracePeriod) {
        return `Problème de paiement (${graceDaysRemaining} jour${graceDaysRemaining > 1 ? 's' : ''} restant${graceDaysRemaining > 1 ? 's' : ''})`
      }
      if (isInCancelledGracePeriod) {
        return `Annulé (accès jusqu'au ${graceDaysRemaining} jour${graceDaysRemaining > 1 ? 's' : ''})`
      }
      switch (status) {
        case 'active':
          return 'Actif'
        case 'past_due':
          return 'Paiement en retard'
        case 'unpaid':
          return 'Non payé'
        case 'cancelled':
          return 'Annulé'
        case 'expired':
          return 'Expiré'
        default:
          return status
      }
    }

    // Retourner les infos essentielles
    const simpleSubscription = {
      id: subscription.lemon_squeezy_id,
      status: subscription.status,
      statusFormatted: translateStatus(subscription.status),
      price: priceInEuros,
      interval: interval,
      planName: translatePlanName(plan?.name),
      isUsageBased: false,
      renewsAt: subscription.renews_at,
      endsAt: subscription.ends_at,
      trialEndsAt: null,
      cardBrand: subscription.card_brand,
      cardLastFour: subscription.card_last_four,
      urls: subscription.urls || {
        customer_portal: null,
        update_payment_method: null,
      },
      // Informations période de grâce
      isInGracePeriod: isInGracePeriod,
      gracePeriodEndsAt: subscription.grace_period_ends_at,
      graceDaysRemaining: graceDaysRemaining,
    }

    return NextResponse.json({ subscription: simpleSubscription })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Méthodes non supportées
 */
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
