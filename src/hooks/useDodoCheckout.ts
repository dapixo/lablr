import { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { CheckoutRequest, CheckoutResponse } from '@/types/dodopayments'

/**
 * Hook pour gérer les checkouts Dodo Payments
 */
export function useDodoCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  /**
   * Crée une session de checkout et redirige vers Dodo Payments
   */
  const createCheckout = useCallback(
    async (billingCycle: 'monthly' | 'yearly') => {
      if (!user) {
        setError('Utilisateur non connecté')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const checkoutRequest: Omit<CheckoutRequest, 'productId'> = {
          userId: user.id,
          billingCycle,
        }

        console.log('[Dodo Checkout] Creating checkout:', checkoutRequest)

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

        console.log('[Dodo Checkout] Redirecting to:', data.checkoutUrl)

        // Redirection vers Dodo Payments
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer')

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[Dodo Checkout] Error:', errorMessage)
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

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
    isConfigured: true, // Configuration vérifiée côté serveur
  }
}
