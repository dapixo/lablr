/**
 * Hook pour gérer les tokens CSRF côté client
 * Récupère automatiquement le token et l'inclut dans les requêtes API
 */

import { useCallback, useEffect, useState } from 'react'

/**
 * Hook pour récupérer et gérer le token CSRF
 * @returns Token CSRF et fonction pour faire des requêtes protégées
 */
export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Récupère le token CSRF depuis l'API
   */
  const fetchCsrfToken = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Important pour envoyer les cookies
      })

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }

      const data = await response.json()
      setCsrfToken(data.csrfToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[CSRF] Error fetching token:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer le token au montage du composant
  useEffect(() => {
    fetchCsrfToken()
  }, [fetchCsrfToken])

  /**
   * Wrapper pour fetch() qui inclut automatiquement le token CSRF
   */
  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!csrfToken) {
        throw new Error('CSRF token not available')
      }

      // Ajouter le token CSRF au header
      const headers = new Headers(options.headers)
      headers.set('x-csrf-token', csrfToken)

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Envoyer les cookies
      })
    },
    [csrfToken]
  )

  return {
    csrfToken,
    loading,
    error,
    refreshToken: fetchCsrfToken,
    csrfFetch,
  }
}
