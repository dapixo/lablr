// Constantes pour les limites de fichier
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_FILE_TYPES = ['.txt', '.csv'] as const

// Constantes pour l'impression
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
} as const

// Codes ISO 3166-1 alpha-2 de tous les pays, noms résolus via Intl.DisplayNames (locale-aware)
const COUNTRY_CODES = [
  'AF', 'ZA', 'AL', 'DZ', 'DE', 'AD', 'AO', 'AG', 'SA', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH',
  'BD', 'BB', 'BE', 'BZ', 'BJ', 'BT', 'BY', 'MM', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI',
  'KH', 'CM', 'CA', 'CV', 'CL', 'CN', 'CY', 'CO', 'KM', 'CG', 'CD', 'KP', 'KR', 'CR', 'CI', 'HR',
  'CU', 'DK', 'DJ', 'DO', 'EG', 'AE', 'EC', 'ER', 'ES', 'EE', 'SZ', 'US', 'ET', 'FJ', 'FI', 'FR',
  'GA', 'GM', 'GE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GQ', 'GY', 'HT', 'HN', 'HU', 'IN', 'ID',
  'IQ', 'IR', 'IE', 'IS', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KG', 'KI', 'KW', 'LA', 'LS',
  'LV', 'LB', 'LR', 'LY', 'LI', 'LT', 'LU', 'MK', 'MG', 'MY', 'MW', 'MV', 'ML', 'MT', 'MA', 'MH',
  'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MZ', 'NA', 'NR', 'NP', 'NI', 'NE', 'NG', 'NO', 'NZ',
  'OM', 'UG', 'UZ', 'PK', 'PW', 'PA', 'PG', 'PY', 'NL', 'PE', 'PH', 'PL', 'PT', 'QA', 'CF',
  'RO', 'GB', 'RU', 'RW', 'SV', 'WS', 'SM', 'ST', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB',
  'SO', 'SD', 'SS', 'LK', 'SE', 'CH', 'SR', 'SY', 'TJ', 'TW', 'TZ', 'TD', 'TH', 'TL', 'TG', 'TO',
  'TT', 'TN', 'TM', 'TR', 'TV', 'UA', 'UY', 'VU', 'VA', 'VE', 'VN', 'YE', 'ZM', 'ZW',
] as const

const DEFAULT_COUNTRY_CODE = 'FR'

// Liste de secours utilisée uniquement si Intl.DisplayNames n'est pas supporté par l'environnement
const FALLBACK_COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'États-Unis', 'Allemagne', 'Italie', 'Espagne',
  'Royaume-Uni', 'Pays-Bas',
]

const countryNamesCache = new Map<string, string[]>()

/**
 * Retourne la liste des pays traduite dans la locale demandée (fr/en), avec cache par locale.
 */
export function getSupportedCountries(locale: string): string[] {
  const cached = countryNamesCache.get(locale)
  if (cached) return cached

  let names: string[]
  try {
    const regionNames = new Intl.DisplayNames([locale], { type: 'region' })
    names = COUNTRY_CODES.map((code) => regionNames.of(code) ?? code).sort((a, b) =>
      a.localeCompare(b, locale)
    )
  } catch {
    names = FALLBACK_COUNTRIES
  }

  countryNamesCache.set(locale, names)
  return names
}

/**
 * Retourne le nom du pays par défaut (France) traduit dans la locale demandée.
 */
export function getDefaultCountry(locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(DEFAULT_COUNTRY_CODE) ?? 'France'
  } catch {
    return 'France'
  }
}
