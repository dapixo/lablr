import { type NextRequest, NextResponse } from 'next/server'
import { setupDodoPayments } from '@/lib/dodopayments/client'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'

/**
 * Génère un lien vers le portail client Dodo Payments
 * Permet à l'utilisateur de gérer son abonnement, modifier sa carte de paiement, etc.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, 'subscription')
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const supabase = await createClient()

    // Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer la subscription active de l'utilisateur
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('customer_id, subscription_id')
      .eq('user_id', user.id)
      .eq('provider', 'dodo')
      .eq('status', 'active')
      .maybeSingle()

    if (subError) {
      console.error('[Dodo Portal] Error fetching subscription:', subError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Vérifier que le customer_id existe
    if (!subscription.customer_id) {
      console.error('[Dodo Portal] Missing customer_id in database')
      return NextResponse.json(
        { error: 'Customer ID not found. Please contact support.' },
        { status: 500 }
      )
    }

    // Générer le lien du portail client via l'API Dodo
    const client = setupDodoPayments()
    const portalSession = await client.customers.customerPortal.create(subscription.customer_id)

    if (!portalSession.link) {
      console.error('[Dodo Portal] No portal link returned')
      return NextResponse.json({ error: 'Failed to generate portal link' }, { status: 500 })
    }

    logger.info(`[Dodo Portal] Generated portal link for user ${user.id}`)

    // Mettre à jour la DB avec le lien du portail
    await supabase
      .from('subscriptions')
      .update({
        urls: {
          customer_portal: portalSession.link,
          update_payment_method: null, // Sera géré plus tard si nécessaire
        },
      })
      .eq('user_id', user.id)
      .eq('provider', 'dodo')
      .eq('subscription_id', subscription.subscription_id)

    const response = NextResponse.json({
      portalUrl: portalSession.link,
    })

    return withRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error('[Dodo Portal] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Méthodes non supportées
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
