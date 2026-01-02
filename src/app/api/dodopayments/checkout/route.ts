import { type NextRequest, NextResponse } from 'next/server'
import { setupDodoPayments } from '@/lib/dodopayments/client'
import { DODO_CONFIG } from '@/lib/dodopayments/config'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'
import type { CheckoutRequest, CheckoutResponse } from '@/types/dodopayments'

/**
 * Domaines autorisés pour CSRF protection
 */
const ALLOWED_ORIGINS = [
  'https://lalabel.app',
  'https://www.lalabel.app',
]

const ALLOWED_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]

/**
 * Création d'une session de checkout Dodo Payments
 */
export async function POST(request: NextRequest) {
  // 🔒 RATE LIMITING : Protection contre le spam de checkouts
  const rateLimitResult = await checkRateLimit(request, 'checkout')
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  // 🔒 CSRF PROTECTION : Vérifier le referer
  const referer = request.headers.get('referer')
  const isDevelopment = process.env.NODE_ENV !== 'production'

  // Domaines ngrok (acceptés en dev pour tests webhooks)
  const isNgrokDomain = referer && (
    referer.includes('ngrok-free.app') ||
    referer.includes('ngrok.io') ||
    referer.includes('ngrok-free.dev') ||
    referer.includes('ngrok.app')
  )

  // Origines autorisées selon l'environnement
  const allowedOrigins = isDevelopment
    ? [...ALLOWED_ORIGINS, ...ALLOWED_DEV_ORIGINS]
    : ALLOWED_ORIGINS

  const isValidReferer =
    !referer || // Pas de referer (tests manuels)
    allowedOrigins.some((allowed) => referer.startsWith(allowed)) ||
    (isDevelopment && isNgrokDomain) // ngrok en dev uniquement

  if (!isValidReferer) {
    console.error('[Dodo Checkout] ❌ REFERER BLOCKED:', {
      referer,
      isDevelopment,
      isNgrokDomain,
    })
    return NextResponse.json({ error: 'Invalid referer' }, { status: 403 })
  }

  logger.info('[Dodo Checkout] ✅ Referer OK')

  try {
    const client = setupDodoPayments()

    const { userId, billingCycle }: Omit<CheckoutRequest, 'productId'> = await request.json()

    // Validation des paramètres
    if (!userId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, billingCycle' },
        { status: 400 }
      )
    }

    // Déterminer le product ID côté serveur
    const productId =
      billingCycle === 'yearly' ? DODO_CONFIG.products.yearly : DODO_CONFIG.products.monthly

    if (!productId) {
      const envVar =
        billingCycle === 'yearly' ? 'DODO_PRODUCT_YEARLY' : 'DODO_PRODUCT_MONTHLY'
      return NextResponse.json(
        { error: `Configuration manquante: ${envVar} non définie` },
        { status: 500 }
      )
    }

    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les informations utilisateur
    const userEmail = user.email
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur'

    logger.info('[Dodo Checkout] Creating subscription:', {
      productId,
      userId,
      billingCycle,
    })

    // Créer le checkout avec Dodo Payments
    const subscription = await client.subscriptions.create({
      product_id: productId,
      quantity: 1,
      customer: {
        email: userEmail!,
        name: userName,
      },
      billing: {
        country: 'FR',
      },
      metadata: {
        user_id: userId,
        billing_cycle: billingCycle,
      },
      payment_link: true,
      return_url: DODO_CONFIG.redirectUrls.success,
    })

    if (!subscription.payment_link) {
      console.error('[Dodo Checkout] No payment link returned')
      return NextResponse.json({ error: 'No checkout URL received' }, { status: 500 })
    }

    logger.info('[Dodo Checkout] Subscription created:', {
      subscriptionId: subscription.subscription_id,
      paymentId: subscription.payment_id,
    })

    const checkoutResponse: CheckoutResponse = {
      checkoutUrl: subscription.payment_link,
      subscription_id: subscription.subscription_id,
      payment_id: subscription.payment_id,
    }

    const response = NextResponse.json(checkoutResponse)
    return withRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error('[Dodo Checkout] Error:', error)
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
