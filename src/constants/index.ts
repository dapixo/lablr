// Constantes pour les limites de fichier
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_FILE_TYPES = ['.txt'] as const

// Constantes pour le parsing des rapports Amazon
export const AMAZON_REPORT_MIN_COLUMNS = 24
export const REQUIRED_COLUMNS = [
  'buyer-name',
  'ship-address-1', 
  'ship-postal-code',
  'ship-city',
  'ship-country'
] as const

// Constantes pour l'impression
export const PRINT_DELAY_MS = 250
export const PREVIEW_MAX_PAGES = 3
export const PREVIEW_MAX_LABELS_ROLL = 8

// Constantes pour les formats d'étiquettes (en mm)
export const LABEL_SIZES = {
  A4_LABELS: {
    width: 105,
    height: 57,
    perPage: 10
  },
  ROLL_LABELS: {
    width: 57,
    height: 32,
    perPage: 1
  }
} as const

// Constantes pour l'aperçu (en pixels)
export const PREVIEW_DIMENSIONS = {
  A4_SHEET: {
    height: 600,
    ratio: 210 / 297 // A4 ratio
  },
  ROLL_LABEL: {
    height: 120,
    ratio: 57 / 32 // Roll ratio
  }
} as const

// Messages d'erreur
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `Le fichier est trop volumineux (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`,
  FILE_EMPTY: 'Le fichier est vide',
  INVALID_FILE_TYPE: `Seuls les fichiers ${ACCEPTED_FILE_TYPES.join(', ')} sont acceptés`,
  INVALID_TSV_FORMAT: 'Format TSV invalide',
  INSUFFICIENT_COLUMNS: `Le fichier doit contenir au moins ${AMAZON_REPORT_MIN_COLUMNS} colonnes`,
  MISSING_REQUIRED_COLUMNS: 'Colonnes requises manquantes dans le fichier',
  VALIDATION_REQUIRED: 'Ce champ est requis'
} as const

// Pays supportés
export const SUPPORTED_COUNTRIES = [
  'France',
  'Belgique', 
  'Suisse',
  'Canada',
  'États-Unis',
  'Allemagne',
  'Italie',
  'Espagne',
  'Royaume-Uni',
  'Pays-Bas'
] as const

export const DEFAULT_COUNTRY = 'France'