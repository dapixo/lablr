'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { debugLog } from '@/lib/debug'
import type { Subscription } from '@/types/subscription'

/**
 * Query key factory pour les subscriptions
 */
const subscriptionKeys = {
  all: ['subscription'] as const,
  detail: (userId: string | undefined) => [...subscriptionKeys.all, userId] as const,
}

/**
 * Response de l'API /api/subscription
 */
interface SubscriptionResponse {
  subscription: Subscription | null
}

/**
 * Hook React Query pour récupérer l'abonnement utilisateur
 * 🚀 Cache 12h avec invalidation manuelle
 *
 * @param userId - ID de l'utilisateur (null si non connecté)
 * @returns Query object avec subscription, isLoading, error, et refresh
 */
export function useSubscription(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: subscriptionKeys.detail(userId || undefined),
    queryFn: async (): Promise<Subscription | null> => {
      if (!userId) {
        debugLog('⚠️ No user ID, returning null subscription')
        return null
      }

      debugLog('📡 Fetching subscription for user:', userId)

      const response = await fetch('/api/subscription', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        // 404 = pas d'abonnement (normal pour utilisateurs free)
        if (response.status === 404) {
          debugLog('✅ No subscription found (free user)')
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const result: SubscriptionResponse = await response.json()
      debugLog('📋 Subscription loaded:', result.subscription?.status)

      return result.subscription
    },
    enabled: !!userId, // Ne fetch que si user connecté
    staleTime: 12 * 60 * 60 * 1000, // 12h - Même TTL que le plan
    gcTime: 24 * 60 * 60 * 1000, // 24h - Garbage collection
    retry: 1,
  })

  /**
   * Force le refresh de la subscription
   * ⚡ Invalide le cache et refetch immédiatement
   */
  const refreshSubscription = useCallback(async () => {
    if (!userId) {
      debugLog('⚠️ No user to refresh subscription for')
      return
    }

    debugLog('🔄 Force refresh subscription for:', userId)

    // Invalider le cache React Query
    await queryClient.invalidateQueries({
      queryKey: subscriptionKeys.detail(userId),
    })

    // Refetch immédiatement
    await refetch()
  }, [userId, queryClient, refetch])

  return {
    subscription: data || null,
    isLoading,
    error: error ? (error as Error).message : null,
    refreshSubscription,
  }
}
