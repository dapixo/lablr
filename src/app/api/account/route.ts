import { NextResponse, type NextRequest } from 'next/server'

import { generateCsrfToken } from '@/lib/csrf'
import { setupDodoPayments } from '@/lib/dodopayments/client'
import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'
import { formatSubscription, type SubscriptionWithPlan } from '@/lib/subscription'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint unifié pour toutes les données de la page Account
 * Retourne user, plan, subscription, portalUrl et csrfToken en une seule requête
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, 'subscription')
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profileResult, subscriptionResult, csrfToken] = await Promise.all([
      supabase.from('profiles').select('plan').eq('user_id', user.id).single(),
      supabase
        .from('subscriptions')
        .select(
          `
          subscription_id,
          customer_id,
          provider,
          status,
          renews_at,
          ends_at,
          card_brand,
          card_last_four,
          urls,
          grace_period_starts_at,
          grace_period_ends_at,
          plan:plans!plan_id (
            name,
            price,
            interval
          )
        `
        )
        .eq('user_id', user.id)
        .in('status', ['active', 'past_due', 'unpaid', 'on_hold', 'cancelled', 'paused'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      generateCsrfToken(),
    ])

    const subscriptionData = subscriptionResult.data as SubscriptionWithPlan | null
    const plan = profileResult.data?.plan || 'free'

    // Générer le portail pour tous les abonnements avec un customer_id
    // Permet de gérer l'abonnement même si annulé (réactivation, mise à jour paiement, etc.)
    let portalUrl: string | null = null
    if (subscriptionData?.customer_id) {
      try {
        const client = setupDodoPayments()
        const portalSession = await client.customers.customerPortal.create(
          subscriptionData.customer_id
        )
        portalUrl = portalSession.link || null
      } catch (error) {
        console.error('[Account API] Failed to create portal URL:', error)
      }
    }

    const accountData = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        createdAt: user.created_at,
      },
      plan,
      subscription: subscriptionData ? formatSubscription(subscriptionData) : null,
      portalUrl,
      csrfToken,
    }

    const response = NextResponse.json(accountData)
    return withRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error('[Account API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
