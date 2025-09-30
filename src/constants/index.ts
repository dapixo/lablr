// Constantes pour les limites de fichier
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_FILE_TYPES = ['.txt', '.csv'] as const

// Constantes pour le parsing des rapports (compatibilité Amazon)
export const AMAZON_REPORT_MIN_COLUMNS = 24

// Constantes pour la détection automatique
export const MIN_DETECTION_CONFIDENCE = 30 // Seuil minimum de confiance en %

// Constantes pour l'impression
export const PRINT_DELAY_MS = 250
export const PREVIEW_MAX_PAGES = 1
export const PREVIEW_MAX_LABELS_ROLL = 8

// Constantes pour l'aperçu (en pixels)
export const PREVIEW_DIMENSIONS = {
  A4_SHEET: {
    height: 600,
    ratio: 210 / 297, // A4 ratio
  },
  ROLL_LABEL: {
    height: 120,
    ratio: 57 / 32, // Roll ratio
  },
} as const

// Messages d'erreur
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `Le fichier est trop volumineux (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`,
  FILE_EMPTY: 'Le fichier est vide',
  INVALID_FILE_TYPE: `Seuls les fichiers ${ACCEPTED_FILE_TYPES.join(', ')} sont acceptés`,
  INVALID_TSV_FORMAT: 'Format de fichier invalide',
  LOW_CONFIDENCE: 'Format de fichier non reconnu - confiance insuffisante',
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
  'Pays-Bas',
] as const

export const DEFAULT_COUNTRY = 'France'
