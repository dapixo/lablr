'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DailyUsage } from '@/app/api/usage/route'
import { useAuth } from './useAuth'

interface UsageTrackingState {
  dailyUsage: DailyUsage | null
  labelsUsed: number
  remainingLabels: number
  isLimitReached: boolean
  loading: boolean
  error: string | null
}

interface UsageTrackingHook extends UsageTrackingState {
  refreshUsage: () => Promise<void>
  trackLabelUsage: (labelCount: number) => Promise<boolean>
  canPrintLabels: (requestedCount: number) => boolean
  getMaxPrintableLabels: (requestedCount: number) => number
}

const FREE_DAILY_LIMIT = 10

/**
 * Hook pour gérer le tracking d'usage des étiquettes avec limites freemium
 */
export function useUsageTracking(): UsageTrackingHook {
  const { user, userPlan, loading: authLoading } = useAuth()

  const [state, setState] = useState<UsageTrackingState>({
    dailyUsage: null,
    labelsUsed: 0,
    remainingLabels: FREE_DAILY_LIMIT,
    isLimitReached: false,
    loading: true,
    error: null,
  })


  /**
   * Récupère l'usage quotidien depuis l'API
   */
  const refreshUsage = useCallback(async () => {
    if (!user || authLoading) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Si l'utilisateur est marqué Premium, pas de limite (plus besoin de vérifier l'API)
      if (userPlan === 'premium') {
        setState({
          dailyUsage: null,
          labelsUsed: 0,
          remainingLabels: Infinity,
          isLimitReached: false,
          loading: false,
          error: null,
        })
        return
      }

      // Pour les utilisateurs free, récupérer l'usage quotidien
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage')
      }

      const dailyUsage = result.data as DailyUsage
      const labelsUsed = dailyUsage.labels_used
      const remainingLabels = Math.max(0, FREE_DAILY_LIMIT - labelsUsed)
      const isLimitReached = labelsUsed >= FREE_DAILY_LIMIT

      setState({
        dailyUsage,
        labelsUsed,
        remainingLabels,
        isLimitReached,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [user?.id, userPlan, authLoading])

  /**
   * Incrémente l'usage des étiquettes
   */
  const trackLabelUsage = useCallback(
    async (labelCount: number): Promise<boolean> => {
      if (!user) {
        console.warn('Cannot track usage: user not authenticated')
        return false
      }

      if (labelCount <= 0) {
        console.warn('Invalid label count:', labelCount)
        return false
      }

      // Si l'utilisateur est Premium, toujours retourner true sans tracking
      if (userPlan === 'premium') {
        return true
      }

      try {
        const response = await fetch('/api/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labelCount }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to track usage')
        }

        // Mettre à jour l'état local
        await refreshUsage()
        return true
      } catch (error) {
        console.error('Error tracking usage:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to track usage',
        }))
        return false
      }
    },
    [user, userPlan, refreshUsage]
  )

  /**
   * Vérifie si l'utilisateur peut imprimer le nombre d'étiquettes demandé
   */
  const canPrintLabels = useCallback(
    (requestedCount: number): boolean => {
      if (!user) return false
      if (userPlan === 'premium') return true
      return state.remainingLabels >= requestedCount
    },
    [user, userPlan, state.remainingLabels]
  )

  /**
   * Retourne le nombre maximum d'étiquettes imprimables
   */
  const getMaxPrintableLabels = useCallback(
    (requestedCount: number): number => {
      if (!user) return 0
      if (userPlan === 'premium') return requestedCount
      return Math.min(requestedCount, state.remainingLabels)
    },
    [user, userPlan, state.remainingLabels]
  )

  // Charger l'usage au montage et quand l'utilisateur change
  useEffect(() => {
    if (!authLoading && user) {
      refreshUsage()
    }
  }, [authLoading, refreshUsage, user]) // refreshUsage is stable with useCallback

  return {
    ...state,
    refreshUsage,
    trackLabelUsage,
    canPrintLabels,
    getMaxPrintableLabels,
  }
}
