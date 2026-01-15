'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { debugLog } from '@/lib/debug'
import type { Subscription } from '@/types/subscription'

const accountKeys = {
  all: ['account'] as const,
  detail: (userId: string | undefined) => [...accountKeys.all, userId] as const,
}

export interface AccountData {
  user: {
    id: string
    email: string
    fullName?: string
    createdAt: string
  }
  plan: 'free' | 'premium'
  subscription: Subscription | null
  portalUrl: string | null
  csrfToken: string
}

/**
 * Hook React Query unifié pour les données de la page Account
 * Charge user, plan, subscription, portalUrl et csrfToken en une seule requête
 */
export function useAccountData(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: accountKeys.detail(userId || undefined),
    queryFn: async (): Promise<AccountData | null> => {
      if (!userId) {
        debugLog('No user ID, returning null account data')
        return null
      }

      debugLog('Fetching account data for user:', userId)

      const response = await fetch('/api/account', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const accountData: AccountData = await response.json()
      debugLog('Account data loaded:', {
        plan: accountData.plan,
        hasSubscription: !!accountData.subscription,
        hasPortalUrl: !!accountData.portalUrl,
      })

      return accountData
    },
    enabled: !!userId,
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  })

  const refreshAccountData = useCallback(async () => {
    if (!userId) {
      debugLog('No user to refresh account data for')
      return
    }

    debugLog('Force refresh account data for:', userId)

    await queryClient.invalidateQueries({
      queryKey: accountKeys.detail(userId),
    })

    await refetch()
  }, [userId, queryClient, refetch])

  return {
    accountData: data || null,
    isLoading,
    error: error ? (error as Error).message : null,
    refreshAccountData,
  }
}
