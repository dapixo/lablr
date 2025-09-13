import type { PrintFormat } from '@/types/address'

export interface LabelDimensions {
  width: string
  height: string
}

export interface FormatConfig {
  pageSettings: {
    margin: number
    fontSize: number
    specialMargins?: string
  }
  layout: {
    type: 'list' | 'grid' | 'compact' | 'roll'
    itemsPerPage?: number
    columns?: number
    rows?: number
  }
  styling: {
    containerClass: string
    itemClass: string
    dimensions?: LabelDimensions
  }
}

// Configuration unifiée de tous les formats d'impression
export const PRINT_CONFIGS: Record<PrintFormat, FormatConfig> = {
  A4: {
    pageSettings: { margin: 20, fontSize: 12 },
    layout: { type: 'list', itemsPerPage: 15 },
    styling: { containerClass: '', itemClass: 'address-item' },
  },

  A4_LABELS_10: {
    pageSettings: { margin: 10, fontSize: 12 },
    layout: { type: 'grid', itemsPerPage: 10, columns: 2, rows: 5 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '105mm', height: '57mm' },
    },
  },

  A4_LABELS_14: {
    pageSettings: { margin: 8, fontSize: 11, specialMargins: '15.1mm 5.95mm' },
    layout: { type: 'grid', itemsPerPage: 14, columns: 2, rows: 7 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '99.1mm', height: '38.1mm' },
    },
  },

  A4_LABELS_16: {
    pageSettings: { margin: 8, fontSize: 10, specialMargins: '12.9mm 5.9mm' },
    layout: { type: 'grid', itemsPerPage: 16, columns: 2, rows: 8 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '99.1mm', height: '33.9mm' },
    },
  },

  A4_LABELS_21: {
    pageSettings: { margin: 8, fontSize: 10, specialMargins: '0mm' },
    layout: { type: 'grid', itemsPerPage: 21, columns: 3, rows: 7 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '70mm', height: '42.4mm' },
    },
  },

  A4_COMPACT: {
    pageSettings: { margin: 15, fontSize: 10 },
    layout: { type: 'compact', itemsPerPage: 20, columns: 2 },
    styling: { containerClass: 'compact-grid', itemClass: 'address-item' },
  },

  ROLL_57x32: {
    pageSettings: { margin: 2, fontSize: 9 },
    layout: { type: 'roll', itemsPerPage: 1 },
    styling: {
      containerClass: '',
      itemClass: 'address-item',
      dimensions: { width: '57mm', height: '32mm' },
    },
  },

  CSV_EXPORT: {
    pageSettings: { margin: 0, fontSize: 0 },
    layout: { type: 'list', itemsPerPage: 0 },
    styling: { containerClass: '', itemClass: '' },
  },
}

// Labels et descriptions des formats
export const PRINT_FORMAT_LABELS: Record<PrintFormat, string> = {
  A4: 'A4 - Format standard',
  A4_LABELS_10: 'A4 - 10 étiquettes autocollantes',
  ROLL_57x32: 'Rouleau - Étiquettes',
  A4_LABELS_14: 'A4 - 14 étiquettes autocollantes',
  A4_LABELS_16: 'A4 - 16 étiquettes autocollantes',
  A4_LABELS_21: 'A4 - 21 étiquettes autocollantes',
  A4_COMPACT: 'A4 - Format compact',
  CSV_EXPORT: 'Export CSV',
}

// Descriptions détaillées pour l'interface
export const PRINT_FORMAT_DESCRIPTIONS: Record<PrintFormat, string> = {
  A4: 'Une adresse par ligne, format classique',
  A4_LABELS_10: '10 étiquettes par page',
  ROLL_57x32: 'Une étiquette par adresse',
  A4_LABELS_14: '14 étiquettes par page',
  A4_LABELS_16: '16 étiquettes par page',
  A4_LABELS_21: '21 étiquettes par page',
  A4_COMPACT: 'Format compact 2 colonnes, économise le papier',
  CSV_EXPORT: 'Export des données au format CSV pour tableur',
}

// Icônes pour l'interface
export const PRINT_FORMAT_ICONS: Record<PrintFormat, string> = {
  A4: '📄',
  A4_LABELS_10: '🏷️',
  ROLL_57x32: '🎞️',
  A4_LABELS_14: '🏛️',
  A4_LABELS_16: '🗂️',
  A4_LABELS_21: '📇',
  A4_COMPACT: '📋',
  CSV_EXPORT: '📊',
}

// Ordre d'affichage des formats
export const PRINT_FORMAT_ORDER: PrintFormat[] = [
  'A4',
  'A4_COMPACT',
  'A4_LABELS_10',
  'A4_LABELS_14',
  'A4_LABELS_16',
  'A4_LABELS_21',
  'ROLL_57x32',
  'CSV_EXPORT',
]

// Fonction utilitaire pour obtenir la configuration d'un format
export function getFormatConfig(format: PrintFormat): FormatConfig {
  return PRINT_CONFIGS[format]
}

// Fonction utilitaire pour vérifier si un format est valide
export function isValidFormat(value: string): value is PrintFormat {
  return PRINT_FORMAT_ORDER.includes(value as PrintFormat)
}
