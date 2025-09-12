import { useMemo } from 'react'
import { getPreviewType } from '@/constants/print-preview'
import { STORAGE_KEYS, useCollapsiblePanel } from '@/lib/storage'
import type { Address, PrintFormat } from '@/types/address'
import { useFormatSelection } from './useFormatSelection'
import { usePrintPagination, useRollPreview } from './usePrintPagination'

/**
 * Hook principal pour la gestion de l'aperçu d'impression
 * Combine tous les autres hooks pour simplifier l'utilisation
 */
export function usePrintPreview(addresses: Address[]) {
  // Gestion de la sélection de format
  const formatSelection = useFormatSelection()

  // Gestion de la pagination
  const pagination = usePrintPagination(addresses, formatSelection.selectedFormat)
  const rollPreview = useRollPreview(addresses)

  // Gestion des panneaux collapsibles
  const printPanel = useCollapsiblePanel(STORAGE_KEYS.PRINT_PANEL_COLLAPSED, false)
  const previewPanel = useCollapsiblePanel(STORAGE_KEYS.PREVIEW_PANEL_COLLAPSED, true)

  // Type d'aperçu à afficher
  const previewType = useMemo(
    () => getPreviewType(formatSelection.selectedFormat),
    [formatSelection.selectedFormat]
  )

  // Fonction de gestion de l'impression/export
  const handleAction = useMemo(() => {
    return (onPrint: (format: PrintFormat) => void, onCSVExport: () => void) => {
      if (formatSelection.isCSVFormat) {
        onCSVExport()
      } else {
        onPrint(formatSelection.selectedFormat)
      }
    }
  }, [formatSelection.selectedFormat, formatSelection.isCSVFormat])

  return {
    // État de la sélection
    format: formatSelection,

    // Pagination et données
    pagination: formatSelection.isRollFormat ? rollPreview : pagination,

    // Interface utilisateur
    panels: {
      print: printPanel,
      preview: previewPanel,
    },

    // Configuration de l'aperçu
    preview: {
      type: previewType,
      shouldShow: addresses.length > 0,
      showCSVPreview: formatSelection.isCSVFormat,
      showRollPreview: formatSelection.isRollFormat,
    },

    // Actions
    handleAction,

    // État dérivé
    isEmpty: addresses.length === 0,
    hasAddresses: addresses.length > 0,
    addressCount: addresses.length,
  }
}
