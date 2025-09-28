import type { PrintFormat } from '@/types/address'

export interface LabelDimensions {
  width: string
  height: string
}

export interface LabelSpacing {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  gapHorizontal: string
  gapVertical: string
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
    spacing?: LabelSpacing
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
    pageSettings: { margin: 0, fontSize: 25, specialMargins: '6mm 0mm 6mm 0mm' },
    layout: { type: 'grid', itemsPerPage: 10, columns: 2, rows: 5 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '105mm', height: '57mm' },
      spacing: {
        marginTop: '6mm',
        marginRight: '0mm',
        marginBottom: '6mm',
        marginLeft: '0mm',
        gapHorizontal: '0mm',
        gapVertical: '0mm',
      },
    },
  },

  A4_LABELS_14: {
    pageSettings: { margin: 0, fontSize: 18, specialMargins: '8mm 0mm 4mm 0mm' },
    layout: { type: 'grid', itemsPerPage: 14, columns: 2, rows: 7 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '105mm', height: '39mm' },
      spacing: {
        marginTop: '8mm',
        marginRight: '0mm',
        marginBottom: '4mm',
        marginLeft: '0mm',
        gapHorizontal: '0mm',
        gapVertical: '0mm',
      },
    },
  },

  A4_LABELS_16: {
    pageSettings: { margin: 0, fontSize: 16, specialMargins: '8.5mm 0mm 8.5mm 0mm' },
    layout: { type: 'grid', itemsPerPage: 16, columns: 2, rows: 8 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '105mm', height: '35mm' },
      spacing: {
        marginTop: '8.5mm',
        marginRight: '0mm',
        marginBottom: '8.5mm',
        marginLeft: '0mm',
        gapHorizontal: '0mm',
        gapVertical: '0mm',
      },
    },
  },

  A4_LABELS_21: {
    pageSettings: { margin: 0, fontSize: 19, specialMargins: '12mm 9.75mm 12mm 9.75mm' },
    layout: { type: 'grid', itemsPerPage: 21, columns: 3, rows: 7 },
    styling: {
      containerClass: 'labels-grid',
      itemClass: 'address-item',
      dimensions: { width: '63.5mm', height: '38.1mm' },
      spacing: {
        marginTop: '12mm',
        marginRight: '9.75mm',
        marginBottom: '12mm',
        marginLeft: '9.75mm',
        gapHorizontal: '1mm',
        gapVertical: '0mm',
      },
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
