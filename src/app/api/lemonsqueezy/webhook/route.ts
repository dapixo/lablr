import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { setupLemonSqueezy } from '@/lib/lemonsqueezy/client'
import { LEMONSQUEEZY_CONFIG } from '@/lib/lemonsqueezy/config'
import { WebhookSubscriptionPayload, LemonSqueezySubscription } from '@/types/lemonsqueezy'
import { getPrice } from '@lemonsqueezy/lemonsqueezy.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Vérification de la signature du webhook Lemon Squeezy
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Suivre exactement la doc officielle Lemon Squeezy
    const hmac = Buffer.from(
      crypto.createHmac('sha256', secret).update(body).digest('hex'),
      'hex'
    )
    const signatureBuffer = Buffer.from(signature || '', 'hex')

    if (signatureBuffer.length === 0 || hmac.length === 0) {
      return false
    }

    if (signatureBuffer.length !== hmac.length) {
      return false
    }

    return crypto.timingSafeEqual(hmac, signatureBuffer)
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Traitement des événements webhook Lemon Squeezy
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const signature = headersList.get('x-signature')

    if (!signature) {
      console.error('Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const body = await request.text()

    // Vérification de la signature
    if (!verifyWebhookSignature(body, signature, LEMONSQUEEZY_CONFIG.webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body) as WebhookSubscriptionPayload
    const eventName = payload.meta.event_name

    console.log(`Processing webhook event: ${eventName}`)

    // Enregistrer l'événement webhook dans la base de données
    const { data: webhookEventData, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        event_name: eventName,
        body: JSON.parse(body),
        processed: false
      })
      .select('id')
      .single()

    if (webhookError) {
      console.error('Failed to save webhook event:', webhookError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const webhookEventId = webhookEventData.id
    let processingError: string | null = null

    // Traitement des événements d'abonnement
    if (eventName.startsWith('subscription_')) {
      try {
        setupLemonSqueezy()

        const attributes = payload.data.attributes
        const variantId = attributes.variant_id.toString()
        const userId = payload.meta.custom_data?.user_id

        // Vérifier que le variant correspond à nos plans configurés
        const validVariants = [
          process.env.LEMONSQUEEZY_VARIANT_MONTHLY,
          process.env.LEMONSQUEEZY_VARIANT_YEARLY
        ]

        if (!validVariants.includes(variantId)) {
          processingError = `Unknown variantId ${variantId}. Expected: ${validVariants.join(', ')}`
        } else if (!userId) {
          processingError = 'No user_id in custom_data'
        } else {
          // SOLUTION SIMPLE : Juste marquer l'utilisateur comme Premium
          console.log(`Processing subscription for user ${userId}, status: ${attributes.status}`)

          if (attributes.status === 'active') {
            // Mettre à jour le profil utilisateur pour le marquer Premium
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: userId,
                plan: 'premium'
              }, {
                onConflict: 'user_id'
              })

            if (profileError) {
              processingError = `Failed to update user profile: ${profileError.message}`
              console.error('Profile update error:', profileError)
            } else {
              console.log(`✅ User ${userId} upgraded to Premium`)

              // Récupérer le plan_id à partir du variant_id
              const { data: plan } = await supabase
                .from('plans')
                .select('id')
                .eq('variant_id', parseInt(variantId))
                .single()

              if (!plan) {
                processingError = `Plan not found for variant_id: ${variantId}`
                console.error('Plan lookup error:', processingError)
                return
              }

              // Créer ou mettre à jour l'enregistrement de subscription
              const subscriptionData = {
                lemon_squeezy_id: payload.data.id,
                order_id: attributes.order_id,
                subscription_item_id: attributes.first_subscription_item?.id || null,
                user_id: userId,
                plan_id: plan.id,
                name: attributes.user_name,
                email: attributes.user_email,
                status: attributes.status,
                status_formatted: attributes.status_formatted,
                price: variantId === process.env.LEMONSQUEEZY_VARIANT_YEARLY ? '48' : '5',
                current_period_start: null, // Non disponible dans ce webhook
                current_period_end: null,   // Non disponible dans ce webhook
                trial_ends_at: attributes.trial_ends_at,
                renews_at: attributes.renews_at,
                ends_at: attributes.ends_at,
                is_paused: attributes.pause !== null,
                is_usage_based: attributes.first_subscription_item?.is_usage_based || false,
                card_brand: attributes.card_brand,
                card_last_four: attributes.card_last_four,
                urls: attributes.urls,
                customer_id: attributes.customer_id,
                product_id: attributes.product_id,
                variant_id: parseInt(variantId)
              }

              const { error: subscriptionError } = await supabase
                .from('subscriptions')
                .upsert(subscriptionData, {
                  onConflict: 'lemon_squeezy_id'
                })

              if (subscriptionError) {
                processingError = `Failed to create subscription: ${subscriptionError.message}`
                console.error('Subscription creation error:', subscriptionError)
              } else {
                console.log(`✅ Subscription created for user ${userId}`)
              }
            }
          } else if (attributes.status === 'past_due' || attributes.status === 'unpaid') {
            // PÉRIODE DE GRÂCE : Garder l'accès Premium pendant 7 jours
            const now = new Date()
            const gracePeriodEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)) // +7 jours

            console.log(`⚠️ Payment issue for user ${userId}, status: ${attributes.status}`)
            console.log(`🕐 Grace period until: ${gracePeriodEnd.toISOString()}`)

            // Mettre à jour le statut de subscription avec période de grâce
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .update({
                status: attributes.status,
                status_formatted: attributes.status_formatted,
                grace_period_starts_at: now.toISOString(),
                grace_period_ends_at: gracePeriodEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('lemon_squeezy_id', payload.data.id)

            if (subscriptionError) {
              console.error('Failed to update subscription with grace period:', subscriptionError)
            } else {
              console.log(`✅ Grace period set for user ${userId} until ${gracePeriodEnd.toISOString()}`)
            }

            // L'utilisateur RESTE Premium pendant la période de grâce
            // Pas de changement du plan dans profiles

          } else if (attributes.status === 'cancelled') {
            // CANCELLED : L'utilisateur garde l'accès jusqu'à ends_at (période de grâce native Lemon Squeezy)
            console.log(`📋 Subscription cancelled for user ${userId}, access until: ${attributes.ends_at}`)

            // Mettre à jour le statut mais GARDER l'utilisateur Premium jusqu'à ends_at
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .update({
                status: attributes.status,
                status_formatted: attributes.status_formatted,
                ends_at: attributes.ends_at,
                updated_at: new Date().toISOString()
              })
              .eq('lemon_squeezy_id', payload.data.id)

            if (subscriptionError) {
              console.error('Failed to update subscription status:', subscriptionError)
            } else {
              console.log(`✅ Subscription ${payload.data.id} marked as cancelled, access preserved until ${attributes.ends_at}`)
            }

            // L'utilisateur reste Premium - la rétrogradation se fera via webhook 'expired'

          } else if (attributes.status === 'expired') {
            // EXPIRED : Maintenant on rétrograde vraiment l'utilisateur
            console.log(`⏰ Subscription expired for user ${userId}, downgrading to Free`)

            const { error: profileError } = await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('user_id', userId)

            if (profileError) {
              processingError = `Failed to downgrade user profile: ${profileError.message}`
            } else {
              console.log(`⬇️ User ${userId} downgraded to Free`)

              // Mettre à jour le statut de subscription
              const { error: subscriptionError } = await supabase
                .from('subscriptions')
                .update({
                  status: attributes.status,
                  status_formatted: attributes.status_formatted,
                  ends_at: attributes.ends_at,
                  grace_period_starts_at: null,
                  grace_period_ends_at: null,
                  updated_at: new Date().toISOString()
                })
                .eq('lemon_squeezy_id', payload.data.id)

              if (subscriptionError) {
                console.error('Failed to update subscription status:', subscriptionError)
              } else {
                console.log(`✅ Subscription ${payload.data.id} expired, user downgraded`)
              }
            }
          } else {
            // Pour les autres statuts (updated, paused, etc.)
            // Récupérer le plan_id à partir du variant_id
            const { data: plan } = await supabase
              .from('plans')
              .select('id')
              .eq('variant_id', parseInt(variantId))
              .single()

            if (!plan) {
              processingError = `Plan not found for variant_id: ${variantId}`
              console.error('Plan lookup error:', processingError)
              return
            }

            const subscriptionData = {
              lemon_squeezy_id: payload.data.id,
              order_id: attributes.order_id,
              subscription_item_id: attributes.first_subscription_item?.id || null,
              user_id: userId,
              plan_id: plan.id,
              name: attributes.user_name,
              email: attributes.user_email,
              status: attributes.status,
              status_formatted: attributes.status_formatted,
              price: variantId === process.env.LEMONSQUEEZY_VARIANT_YEARLY ? '48' : '5',
              trial_ends_at: attributes.trial_ends_at,
              renews_at: attributes.renews_at,
              ends_at: attributes.ends_at,
              is_paused: attributes.pause !== null,
              is_usage_based: attributes.first_subscription_item?.is_usage_based || false,
              card_brand: attributes.card_brand,
              card_last_four: attributes.card_last_four,
              urls: attributes.urls,
              customer_id: attributes.customer_id,
              product_id: attributes.product_id,
              variant_id: parseInt(variantId),
              updated_at: new Date().toISOString()
            }

            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert(subscriptionData, {
                onConflict: 'lemon_squeezy_id'
              })

            if (subscriptionError) {
              processingError = `Failed to update subscription: ${subscriptionError.message}`
              console.error('Subscription update error:', subscriptionError)
            } else {
              console.log(`✅ Subscription updated for user ${userId}`)
            }
          }
        }
      } catch (error) {
        processingError = `Error processing subscription event: ${error}`
        console.error('Subscription processing error:', error)
      }
    }

    // Marquer l'événement comme traité
    await supabase
      .from('webhook_events')
      .update({
        processed: true,
        processing_error: processingError,
        updated_at: new Date().toISOString()
      })
      .eq('id', webhookEventId)

    if (processingError) {
      console.error('Webhook processing error:', processingError)
      return NextResponse.json({ error: 'Processing error', details: processingError }, { status: 500 })
    }

    console.log(`Successfully processed webhook event: ${eventName}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}