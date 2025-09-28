import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { type NextRequest, NextResponse } from 'next/server'
import { setupLemonSqueezy } from '@/lib/lemonsqueezy/client'
import { LEMONSQUEEZY_CONFIG } from '@/lib/lemonsqueezy/config'
import { createClient } from '@/lib/supabase/server'
import type { CheckoutRequest, CheckoutResponse } from '@/types/lemonsqueezy'

/**
 * Création d'une session de checkout Lemon Squeezy
 */
export async function POST(request: NextRequest) {
  try {
    setupLemonSqueezy()

    const { userId, billingCycle }: Omit<CheckoutRequest, 'variantId'> = await request.json()

    // Validation des paramètres
    if (!userId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, billingCycle' },
        { status: 400 }
      )
    }

    // Déterminer le variant ID côté serveur
    const variantId =
      billingCycle === 'yearly'
        ? LEMONSQUEEZY_CONFIG.variants.yearly
        : LEMONSQUEEZY_CONFIG.variants.monthly

    // Vérifier si on est en mode test
    const isTestMode =
      variantId.startsWith('test_') || LEMONSQUEEZY_CONFIG.storeId.startsWith('test_')

    if (isTestMode) {
      console.log('🧪 Mode test Lemon Squeezy détecté')

      // Simuler une réponse de test réussie
      return NextResponse.json({
        checkoutUrl: `https://test-checkout.lemonsqueezy.com/test?variant=${variantId}&user=${userId}&billing=${billingCycle}`,
      })
    }

    if (!variantId) {
      const envVar =
        billingCycle === 'yearly' ? 'LEMONSQUEEZY_VARIANT_YEARLY' : 'LEMONSQUEEZY_VARIANT_MONTHLY'
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

    // Validation du variant ID
    const validVariants = [
      LEMONSQUEEZY_CONFIG.variants.monthly,
      LEMONSQUEEZY_CONFIG.variants.yearly,
    ]

    if (!validVariants.includes(variantId)) {
      return NextResponse.json({ error: 'Invalid variant ID' }, { status: 400 })
    }

    // Créer le checkout avec Lemon Squeezy
    const checkoutData = {
      checkoutData: {
        email: userEmail,
        name: userName,
        custom: {
          user_id: userId,
          billing_cycle: billingCycle,
        },
      },
      productOptions: {
        redirectUrl: LEMONSQUEEZY_CONFIG.redirectUrls.success,
        receiptButtonText: 'Accéder à mon compte',
        receiptThankYouNote:
          'Merci pour votre abonnement Premium ! Vous pouvez maintenant profiter de toutes les fonctionnalités.',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    }

    console.log('Creating checkout with:', {
      storeId: LEMONSQUEEZY_CONFIG.storeId,
      variantId,
      checkoutData,
    })

    const { data, error } = await createCheckout(
      LEMONSQUEEZY_CONFIG.storeId,
      variantId,
      checkoutData
    )

    if (error) {
      console.error('Lemon Squeezy checkout error:', error)
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    if (!data?.data?.attributes?.url) {
      console.error('No checkout URL returned from Lemon Squeezy')
      return NextResponse.json({ error: 'No checkout URL received' }, { status: 500 })
    }

    const checkoutUrl = data.data.attributes.url

    console.log('Checkout created successfully:', checkoutUrl)

    const response: CheckoutResponse = {
      checkoutUrl,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Checkout API error:', error)
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
