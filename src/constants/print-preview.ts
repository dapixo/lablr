import type { PrintFormat } from '@/types/address'

// Configuration des aperçus d'étiquettes
export const PRINT_PREVIEW_CONFIG = {
  // Nombre d'éléments par page selon le format
  ITEMS_PER_PAGE: {
    A4_LABELS_10: 10,
    A4_LABELS_14: 14,
    A4_LABELS_16: 16,
    A4_LABELS_21: 21,
    A4_COMPACT: 20,
    A4: 15,
    ROLL_57x32: 1,
    CSV_EXPORT: 0,
  } as const,
  
  // Configuration des grilles d'étiquettes pour l'aperçu
  LABEL_GRID_CONFIG: {
    A4_LABELS_10: { gridCols: 2, gridRows: 5, height: '19%' },
    A4_LABELS_14: { gridCols: 2, gridRows: 7, height: '14.3%' },
    A4_LABELS_16: { gridCols: 2, gridRows: 8, height: '12.5%' },
    A4_LABELS_21: { gridCols: 3, gridRows: 7, height: '13%' },
  } as const,
  
  // Tailles de police pour l'aperçu
  PREVIEW_FONT_SIZES: {
    A4_LABELS_10: '7px',
    A4_LABELS_14: '6.5px',
    A4_LABELS_16: '6px', 
    A4_LABELS_21: '6px',
    A4_COMPACT: '7px',
    A4: '8px',
    ROLL_57x32: '9px',
    CSV_EXPORT: '12px',
  } as const,
  
  // Hauteurs minimales pour l'aperçu
  PREVIEW_MIN_HEIGHTS: {
    A4_LABELS_10: '80px',
    A4_LABELS_14: '60px',
    A4_LABELS_16: '55px',
    A4_LABELS_21: '55px',
    A4_COMPACT: '70px',
    A4: '40px',
    ROLL_57x32: '120px',
  } as const,
  
  // Padding pour l'aperçu
  PREVIEW_PADDING: {
    A4_LABELS_10: '6px',
    A4_LABELS_14: '5px',
    A4_LABELS_16: '4px',
    A4_LABELS_21: '4px',
    A4_COMPACT: '8px',
    A4: '10px',
    ROLL_57x32: '2px',
  } as const,
} as const

// Dimensions pour l'aperçu des feuilles A4
export const PREVIEW_DIMENSIONS = {
  A4_SHEET: {
    height: 600, // Hauteur de base en pixels
    ratio: 210 / 297, // Ratio A4 (largeur/hauteur)
  },
  ROLL_LABEL: {
    height: 120, // Hauteur de base en pixels pour les étiquettes rouleau
    ratio: 57 / 32, // Ratio des étiquettes rouleau
  },
} as const

// Limites d'affichage
export const PREVIEW_LIMITS = {
  MAX_PAGES: 1,
  MAX_LABELS_ROLL: 10,
} as const

// Fonction utilitaire pour obtenir la configuration d'aperçu d'un format
export function getPreviewConfig(format: PrintFormat) {
  return {
    itemsPerPage: PRINT_PREVIEW_CONFIG.ITEMS_PER_PAGE[format] || 15,
    fontSize: PRINT_PREVIEW_CONFIG.PREVIEW_FONT_SIZES[format] || '8px',
    minHeight: PRINT_PREVIEW_CONFIG.PREVIEW_MIN_HEIGHTS[format as keyof typeof PRINT_PREVIEW_CONFIG.PREVIEW_MIN_HEIGHTS] || '40px',
    padding: PRINT_PREVIEW_CONFIG.PREVIEW_PADDING[format as keyof typeof PRINT_PREVIEW_CONFIG.PREVIEW_PADDING] || '6px',
    gridConfig: PRINT_PREVIEW_CONFIG.LABEL_GRID_CONFIG[format as keyof typeof PRINT_PREVIEW_CONFIG.LABEL_GRID_CONFIG],
  }
}

// Fonction pour déterminer le type de preview à utiliser
export function getPreviewType(format: PrintFormat): 'labels' | 'compact' | 'list' | 'roll' | 'csv' {
  if (format === 'CSV_EXPORT') return 'csv'
  if (format === 'ROLL_57x32') return 'roll'
  if (format === 'A4_COMPACT') return 'compact'
  if (format.includes('LABELS')) return 'labels'
  return 'list'
}