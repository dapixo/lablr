'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { debugLog } from '@/lib/debug'
import type { CheckoutEvent, CheckoutRequest, CheckoutResponse } from '@/types/dodopayments'

// Import dynamique pour éviter les erreurs SSR
let DodoPayments: typeof import('dodopayments-checkout').DodoPayments | null = null

/**
 * Détermine le mode Dodo (test ou live) basé sur l'environnement
 */
function getDodoMode(): 'test' | 'live' {
  return process.env.NODE_ENV === 'production' ? 'live' : 'test'
}

/**
 * Hook pour gérer les checkouts Dodo Payments en mode Overlay
 * Le checkout s'ouvre dans une modal au-dessus de la page
 */
export function useDodoCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')
  const { user } = useAuth()
  const isInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const onSuccessCallbackRef = useRef<(() => void) | null>(null)
  const eventHandlerRef = useRef<((event: CheckoutEvent) => void) | null>(null)

  /**
   * Gestionnaire d'événements du checkout
   * Structure: { event_type: string, data?: { message?: ... } }
   */
  const handleCheckoutEvent = useCallback((event: CheckoutEvent) => {
    debugLog('[Dodo Checkout] Event received:', event)

    switch (event.event_type) {
      case 'checkout.opened':
        setIsLoading(false)
        debugLog('[Dodo Checkout] Overlay opened')
        break

      case 'checkout.closed':
        debugLog('[Dodo Checkout] Overlay closed')
        // Si fermé sans succès, reset loading
        if (checkoutStatus !== 'succeeded') {
          setIsLoading(false)
        }
        break

      case 'checkout.status': {
        // Reçu quand manualRedirect est activé
        const statusData = event.data?.message
        const status = typeof statusData === 'object' ? statusData?.status : undefined

        if (status === 'succeeded') {
          setCheckoutStatus('succeeded')
          setIsLoading(false)
          debugLog('[Dodo Checkout] Payment succeeded!')
          if (onSuccessCallbackRef.current) {
            onSuccessCallbackRef.current()
          }
        } else if (status === 'failed') {
          setCheckoutStatus('failed')
          setError('Le paiement a échoué')
          setIsLoading(false)
        } else if (status === 'processing') {
          setCheckoutStatus('processing')
        }
        break
      }

      case 'checkout.redirect_requested': {
        // Reçu quand manualRedirect est activé
        const redirectData = event.data?.message
        const redirectUrl = typeof redirectData === 'object' ? redirectData?.redirect_to : undefined

        debugLog('[Dodo Checkout] Redirect requested:', redirectUrl)
        if (redirectUrl) {
          window.location.href = redirectUrl
        }
        break
      }

      case 'checkout.link_expired':
        setError('Le lien de paiement a expiré')
        setCheckoutStatus('failed')
        setIsLoading(false)
        break

      case 'checkout.error': {
        const errorMessage = typeof event.data?.message === 'string'
          ? event.data.message
          : 'Une erreur est survenue'
        console.error('[Dodo Checkout] Error:', errorMessage)
        setError(errorMessage)
        setIsLoading(false)
        break
      }
    }
  }, [checkoutStatus])

  // Stocker le handler dans une ref pour l'initialisation lazy
  eventHandlerRef.current = handleCheckoutEvent

  /**
   * Initialise le SDK Dodo Payments (lazy - appelé seulement au premier checkout)
   */
  const initializeSDK = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (isInitializedRef.current) return true
    if (isInitializingRef.current) {
      // Attendre que l'initialisation en cours se termine
      await new Promise(resolve => setTimeout(resolve, 100))
      return isInitializedRef.current
    }

    isInitializingRef.current = true

    try {
      const module = await import('dodopayments-checkout')
      DodoPayments = module.DodoPayments

      DodoPayments.Initialize({
        mode: getDodoMode(),
        displayType: 'overlay',
        onEvent: (event: unknown) => {
          if (eventHandlerRef.current) {
            eventHandlerRef.current(event as CheckoutEvent)
          }
        },
      })

      isInitializedRef.current = true
      debugLog('[Dodo Checkout] SDK initialized in', getDodoMode(), 'mode')
      return true
    } catch (err) {
      console.error('[Dodo Checkout] Failed to initialize SDK:', err)
      isInitializingRef.current = false
      return false
    }
  }, [])

  /**
   * Crée une session de checkout et ouvre l'overlay
   */
  const createCheckout = useCallback(
    async (billingCycle: 'monthly' | 'yearly', onSuccess?: () => void) => {
      if (!user) {
        setError('Utilisateur non connecté')
        return false
      }

      // Initialisation lazy du SDK
      const initialized = await initializeSDK()
      if (!initialized || !DodoPayments) {
        setError('Impossible d\'initialiser le système de paiement')
        return false
      }

      // Stocker le callback de succès
      onSuccessCallbackRef.current = onSuccess || null

      setIsLoading(true)
      setError(null)
      setCheckoutStatus('idle')

      try {
        const checkoutRequest: Omit<CheckoutRequest, 'productId'> = {
          userId: user.id,
          billingCycle,
        }

        debugLog('[Dodo Checkout] Creating checkout session:', checkoutRequest)

        const response = await fetch('/api/dodopayments/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkoutRequest),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data: CheckoutResponse = await response.json()

        if (!data.checkoutUrl) {
          throw new Error('URL de checkout non reçue')
        }

        debugLog('[Dodo Checkout] Opening overlay with URL:', data.checkoutUrl)

        // Ouvrir l'overlay avec manualRedirect pour recevoir les événements de statut
        DodoPayments.Checkout.open({
          checkoutUrl: data.checkoutUrl,
          options: {
            showTimer: true,
            showSecurityBadge: true,
            manualRedirect: true, // Nécessaire pour recevoir checkout.status et checkout.redirect_requested
          },
        })

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[Dodo Checkout] Error:', errorMessage)
        setError(errorMessage)
        setIsLoading(false)
        return false
      }
    },
    [user, initializeSDK]
  )

  /**
   * Réinitialise les erreurs et le statut
   */
  const clearError = useCallback(() => {
    setError(null)
    setCheckoutStatus('idle')
  }, [])

  /**
   * No-op pour compatibilité avec l'ancien système de cache
   */
  const clearPendingCheckout = useCallback(() => {
    debugLog('[Dodo Checkout] clearPendingCheckout called (no-op in overlay mode)')
  }, [])

  return {
    createCheckout,
    isLoading,
    error,
    clearError,
    clearPendingCheckout,
    checkoutStatus,
    isConfigured: true,
  }
}
