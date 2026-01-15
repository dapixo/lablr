/**
 * Hook pour gérer les tokens CSRF côté client avec React Query
 * 🚀 Cache 1h pour éviter les fetches répétés
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { debugLog } from '@/lib/debug'

/**
 * Query key pour le token CSRF
 */
const csrfTokenKeys = {
  token: ['csrfToken'] as const,
}

/**
 * Options pour le hook useCsrfToken
 */
interface UseCsrfTokenOptions {
  enabled?: boolean
}

/**
 * Hook React Query pour récupérer et gérer le token CSRF
 * 🚀 Cache 1h avec invalidation manuelle
 * @param options - Options du hook (enabled pour activer/désactiver)
 * @returns Token CSRF et fonction pour faire des requêtes protégées
 */
export function useCsrfToken(options?: UseCsrfTokenOptions) {
  const queryClient = useQueryClient()

  const {
    data: csrfToken,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: csrfTokenKeys.token,
    queryFn: async (): Promise<string> => {
      debugLog('📡 Fetching CSRF token')

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Important pour envoyer les cookies
      })

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }

      const data = await response.json()
      debugLog('🔐 CSRF token loaded')
      return data.csrfToken
    },
    enabled: options?.enabled !== false, // Par défaut enabled, sauf si explicitement false
    staleTime: 60 * 60 * 1000, // 1h - Token valide pendant 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h - Garbage collection
    retry: 2, // 2 retries car critique pour les requêtes protégées
  })

  /**
   * Force le refresh du token CSRF
   * ⚡ Invalide le cache et refetch immédiatement
   */
  const refreshToken = useCallback(async () => {
    debugLog('🔄 Force refresh CSRF token')

    // Invalider le cache React Query
    await queryClient.invalidateQueries({
      queryKey: csrfTokenKeys.token,
    })

    // Refetch immédiatement
    await refetch()
  }, [queryClient, refetch])

  /**
   * Wrapper pour fetch() qui inclut automatiquement le token CSRF
   * ⚡ STABLE : Mémorisé avec csrfToken comme seule dépendance
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
    csrfToken: csrfToken || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshToken,
    csrfFetch,
  }
}
