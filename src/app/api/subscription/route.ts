import { type NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'
import {
  formatSubscription,
  getDefaultSubscription,
  type SubscriptionWithPlan,
} from '@/lib/subscription'
import { createClient } from '@/lib/supabase/server'

/**
 * Récupération des données d'abonnement utilisateur
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

    const { data: subscription, error: subscriptionError } = await supabase
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
      .maybeSingle()

    const subscriptionData = subscription as SubscriptionWithPlan | null

    if (subscriptionError || !subscriptionData) {
      console.error('Subscription query error:', subscriptionError)
      return NextResponse.json(getDefaultSubscription())
    }

    const response = NextResponse.json({ subscription: formatSubscription(subscriptionData) })
    return withRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error('Subscription API error:', error)
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
