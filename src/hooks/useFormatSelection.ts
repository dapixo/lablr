import { useMemo } from 'react'
import type { PrintFormat } from '@/types/address'
import { STORAGE_KEYS, usePersistedSelection } from '@/lib/storage'
import { getFormatConfig, isValidFormat } from '@/lib/print/config'
import { getPreviewConfig } from '@/constants/print-preview'

/**
 * Hook personnalisé pour la gestion de la sélection de format d'impression
 */
export function useFormatSelection() {
  const selectedFormat = usePersistedSelection(
    STORAGE_KEYS.SELECTED_FORMAT, 
    'A4' as PrintFormat, 
    isValidFormat
  )
  
  const formatConfig = useMemo(() => 
    getFormatConfig(selectedFormat.value), 
    [selectedFormat.value]
  )
  
  const previewConfig = useMemo(() => 
    getPreviewConfig(selectedFormat.value),
    [selectedFormat.value]
  )
  
  const itemsPerPage = useMemo(() => 
    formatConfig.layout.itemsPerPage || 15,
    [formatConfig.layout.itemsPerPage]
  )
  
  return {
    selectedFormat: selectedFormat.value,
    updateFormat: selectedFormat.updateValue,
    formatConfig,
    previewConfig,
    itemsPerPage,
    
    // Propriétés dérivées pour faciliter l'utilisation
    isCSVFormat: selectedFormat.value === 'CSV_EXPORT',
    isRollFormat: selectedFormat.value === 'ROLL_57x32',
    isGridFormat: formatConfig.layout.type === 'grid',
    isCompactFormat: formatConfig.layout.type === 'compact',
  }
}