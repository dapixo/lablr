'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import type { DailyUsage } from '@/app/api/usage/route'

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
  const { user, loading: authLoading } = useAuth()

  const [state, setState] = useState<UsageTrackingState>({
    dailyUsage: null,
    labelsUsed: 0,
    remainingLabels: FREE_DAILY_LIMIT,
    isLimitReached: false,
    loading: true,
    error: null
  })

  /**
   * Récupère l'usage quotidien depuis l'API
   */
  const refreshUsage = useCallback(async () => {
    console.log('🚀 refreshUsage called, conditions:', {
      hasUser: !!user,
      authLoading,
      userId: user?.id
    })

    if (!user || authLoading) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      console.log('📡 Making GET /api/usage request...')
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
        error: null
      })

    } catch (error) {
      console.error('Error fetching usage:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [user?.id, authLoading]) // Only depend on user.id, not the entire user object

  /**
   * Incrémente l'usage des étiquettes
   */
  const trackLabelUsage = useCallback(async (labelCount: number): Promise<boolean> => {
    if (!user) {
      console.warn('Cannot track usage: user not authenticated')
      return false
    }

    if (labelCount <= 0) {
      console.warn('Invalid label count:', labelCount)
      return false
    }

    try {
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelCount })
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
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to track usage'
      }))
      return false
    }
  }, [user, refreshUsage])

  /**
   * Vérifie si l'utilisateur peut imprimer le nombre d'étiquettes demandé
   */
  const canPrintLabels = useCallback((requestedCount: number): boolean => {
    if (!user) return false
    return state.remainingLabels >= requestedCount
  }, [user, state.remainingLabels])

  /**
   * Retourne le nombre maximum d'étiquettes imprimables
   */
  const getMaxPrintableLabels = useCallback((requestedCount: number): number => {
    if (!user) return 0
    return Math.min(requestedCount, state.remainingLabels)
  }, [user, state.remainingLabels])

  // Charger l'usage au montage et quand l'utilisateur change
  useEffect(() => {
    if (!authLoading && user) {
      refreshUsage()
    }
  }, [user?.id, authLoading, refreshUsage]) // Stable dependencies

  return {
    ...state,
    refreshUsage,
    trackLabelUsage,
    canPrintLabels,
    getMaxPrintableLabels
  }
}