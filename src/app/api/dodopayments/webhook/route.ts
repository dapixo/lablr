import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { DODO_CONFIG } from '@/lib/dodopayments/config'
import { dispatchWebhookEvent } from '@/lib/dodopayments/webhook-handlers'
import { createSanitizedErrorResponse, SANITIZED_ERRORS } from '@/lib/error-sanitizer'
import { logger } from '@/lib/logger'
import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'
import type { WebhookSubscriptionPayload } from '@/types/dodopayments'

/**
 * Crée un client Supabase avec validation des variables d'environnement
 */
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

/**
 * Traitement des événements webhook Dodo Payments
 */
export async function POST(request: NextRequest) {
  // Appliquer rate limiting pour protéger contre le spam de webhooks
  const rateLimitResult = await checkRateLimit(request, 'webhook')
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const supabase = createSupabaseClient()
    const headersList = await headers()

    // 🔒 SÉCURITÉ : Récupération des headers Dodo Payments
    const signature = headersList.get('webhook-signature')
    const webhookId = headersList.get('webhook-id')
    const webhookTimestamp = headersList.get('webhook-timestamp')

    if (!signature) {
      console.error('[Dodo Webhook] Missing signature')
      return NextResponse.json({ error: SANITIZED_ERRORS.SIGNATURE_INVALID }, { status: 401 })
    }

    if (!webhookId) {
      console.error('[Dodo Webhook] Missing webhook-id')
      return NextResponse.json({ error: SANITIZED_ERRORS.SIGNATURE_INVALID }, { status: 401 })
    }

    if (!webhookTimestamp) {
      console.error('[Dodo Webhook] Missing webhook-timestamp')
      return NextResponse.json({ error: SANITIZED_ERRORS.SIGNATURE_INVALID }, { status: 401 })
    }

    // 🔒 PROTECTION REPLAY ATTACKS : Vérifier que le timestamp est récent (max 5 minutes)
    const timestamp = Number.parseInt(webhookTimestamp, 10)
    const now = Math.floor(Date.now() / 1000)
    const FIVE_MINUTES = 5 * 60

    if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > FIVE_MINUTES) {
      console.error('[Dodo Webhook] Invalid or expired timestamp')
      return NextResponse.json({ error: SANITIZED_ERRORS.SIGNATURE_INVALID }, { status: 401 })
    }

    // 🔒 IDEMPOTENCE : Vérifier si cet événement a déjà été traité
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('webhook_id', webhookId)
      .maybeSingle()

    if (existingEvent) {
      logger.info(`[Dodo Webhook] Event ${webhookId} already processed, skipping`)
      return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 })
    }

    const body = await request.text()

    // 🔒 VÉRIFICATION SIGNATURE : Utilisation de standardwebhooks (même lib que le SDK Dodo)
    try {
      const webhook = new Webhook(DODO_CONFIG.webhookSecret)
      webhook.verify(body, {
        'webhook-signature': signature,
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
      })
      logger.info('[Dodo Webhook] Signature verified successfully')
    } catch (error) {
      console.error('[Dodo Webhook] Signature verification failed:', error)
      return NextResponse.json({ error: SANITIZED_ERRORS.SIGNATURE_INVALID }, { status: 401 })
    }

    const payload = JSON.parse(body) as WebhookSubscriptionPayload

    // Le champ event s'appelle 'type' dans le payload Dodo (pas 'event_name')
    const eventName = payload.type

    logger.info(`[Dodo Webhook] Processing event: ${eventName} (ID: ${webhookId})`)
    logger.info('[Dodo Webhook] Payload data:', JSON.stringify(payload.data, null, 2))

    // Enregistrer l'événement webhook via RPC (sécurisé avec RLS)
    const { data: webhookEventId, error: webhookError } = await supabase.rpc(
      'insert_webhook_event',
      {
        p_webhook_id: webhookId,
        p_event_name: eventName,
        p_body: JSON.parse(body),
      }
    )

    if (webhookError) {
      // L'idempotence est gérée dans la fonction RPC elle-même
      const sanitized = createSanitizedErrorResponse(webhookError, 500, {
        operation: 'insert_webhook_event',
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: sanitized.message }, { status: sanitized.statusCode })
    }

    let processingError: string | null = null

    // Traitement des événements d'abonnement via handler map pattern
    if (eventName.startsWith('subscription.')) {
      const result = await dispatchWebhookEvent({
        supabase,
        eventName,
        subscriptionData: payload.data,
      })

      if (!result.success) {
        processingError = result.error || 'Unknown error during event processing'
      }
    }

    // Marquer l'événement comme traité via RPC
    await supabase.rpc('update_webhook_event', {
      p_event_id: webhookEventId,
      p_processed: true,
      p_processing_error: processingError,
    })

    if (processingError) {
      console.error('[Dodo Webhook] Error:', processingError)
      return NextResponse.json({ error: SANITIZED_ERRORS.WEBHOOK_ERROR }, { status: 500 })
    }

    logger.info(`[Dodo Webhook] Successfully processed: ${eventName}`)
    const response = NextResponse.json({ success: true })
    return withRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    const sanitized = createSanitizedErrorResponse(error, 500, {
      operation: 'webhook_processing',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: sanitized.message }, { status: sanitized.statusCode })
  }
}
