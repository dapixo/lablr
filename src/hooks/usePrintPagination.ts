import { useMemo } from 'react'
import type { Address, PrintFormat } from '@/types/address'
import { PREVIEW_LIMITS } from '@/constants/print-preview'
import { getPreviewConfig } from '@/constants/print-preview'

/**
 * Hook personnalisé pour les calculs de pagination d'impression
 */
export function usePrintPagination(addresses: Address[], format: PrintFormat) {
  return useMemo(() => {
    const { itemsPerPage } = getPreviewConfig(format)
    const totalPages = Math.ceil(addresses.length / itemsPerPage)
    const pagesToShow = Math.min(PREVIEW_LIMITS.MAX_PAGES, totalPages)
    
    return {
      itemsPerPage,
      totalPages,
      pagesToShow,
      
      // Fonction pour obtenir les adresses d'une page spécifique
      getPageAddresses: (pageIndex: number): Address[] => {
        const startIndex = pageIndex * itemsPerPage
        return addresses.slice(startIndex, startIndex + itemsPerPage)
      },
      
      // Informations utiles
      hasMorePages: totalPages > pagesToShow,
      remainingPages: Math.max(0, totalPages - pagesToShow),
      isEmpty: addresses.length === 0,
    }
  }, [addresses, format])
}

/**
 * Hook spécialisé pour l'aperçu des étiquettes rouleau
 */
export function useRollPreview(addresses: Address[]) {
  return useMemo(() => {
    const maxLabelsToShow = Math.min(PREVIEW_LIMITS.MAX_LABELS_ROLL, addresses.length)
    
    return {
      maxLabelsToShow,
      hasMoreLabels: addresses.length > maxLabelsToShow,
      remainingLabels: Math.max(0, addresses.length - maxLabelsToShow),
      
      // Fonction pour obtenir les étiquettes à afficher
      getDisplayLabels: (): Address[] => {
        return addresses.slice(0, maxLabelsToShow)
      },
    }
  }, [addresses])
}