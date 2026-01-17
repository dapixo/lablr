'use client'

import { useAuth } from './useAuth'

const FREE_PRINT_LIMIT = 5

/**
 * Hook simplifié pour gérer la limite d'impression freemium
 *
 * Limite: 5 étiquettes maximum par impression pour les utilisateurs gratuits
 * Les utilisateurs premium n'ont aucune limite
 */
export function usePrintLimit() {
  const { userPlan } = useAuth()

  /**
   * Vérifie si l'utilisateur peut imprimer le nombre demandé d'étiquettes
   */
  const canPrintAll = (requestedCount: number): boolean => {
    if (userPlan === 'premium') return true
    return requestedCount <= FREE_PRINT_LIMIT
  }

  /**
   * Retourne le nombre maximum d'étiquettes imprimables
   */
  const getMaxPrintable = (requestedCount: number): number => {
    if (userPlan === 'premium') return requestedCount
    return Math.min(requestedCount, FREE_PRINT_LIMIT)
  }

  return {
    freePrintLimit: FREE_PRINT_LIMIT,
    isPremium: userPlan === 'premium',
    canPrintAll,
    getMaxPrintable,
  }
}
