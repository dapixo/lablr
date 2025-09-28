import { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { CheckoutRequest, CheckoutResponse } from '@/types/lemonsqueezy'

/**
 * Hook pour gérer les checkouts Lemon Squeezy
 */
export function useLemonSqueezyCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  /**
   * Crée une session de checkout et redirige vers Lemon Squeezy
   */
  const createCheckout = useCallback(async (billingCycle: 'monthly' | 'yearly') => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // L'API déterminera le variant ID côté serveur
      const checkoutRequest: CheckoutRequest = {
        variantId: '', // Sera déterminé côté serveur
        userId: user.id,
        billingCycle
      }

      console.log('Creating checkout with:', checkoutRequest)

      const response = await fetch('/api/lemonsqueezy/checkout', {
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

      console.log('Redirecting to checkout:', data.checkoutUrl)

      // Redirection vers Lemon Squeezy
      window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer')

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Checkout error:', errorMessage)
      setError(errorMessage)
      return false

    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * Réinitialise les erreurs
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    createCheckout,
    isLoading,
    error,
    clearError,
    isConfigured: true // Configuration vérifiée côté serveur
  }
}