// Types pour la détection automatique des colonnes
export interface ColumnMapping {
  firstName?: number
  lastName?: number
  fullName?: number
  addressLine1?: number
  addressLine2?: number
  addressLine3?: number
  city?: number
  state?: number
  postalCode?: number
  country?: number
}

export interface DetectionResult {
  mapping: ColumnMapping
  confidence: number // 0-100
  platform: PlatformType
  separator: string
  hasHeaders: boolean
}

export type PlatformType =
  | 'AMAZON_SELLER'
  | 'SHOPIFY'
  | 'EBAY'
  | 'ETSY'
  | 'WOOCOMMERCE'
  | 'GENERIC'
  | 'UNIVERSAL'
  | 'UNKNOWN'

// Définitions des patterns de colonnes par plateforme
export const PLATFORM_PATTERNS = {
  AMAZON_SELLER: {
    name: 'Amazon Seller',
    confidence: 95,
    patterns: {
      fullName: ['recipient-name', 'ship-to-name'],
      addressLine1: ['ship-address-1', 'shipping-address-1'],
      addressLine2: ['ship-address-2', 'shipping-address-2'],
      addressLine3: ['ship-address-3', 'shipping-address-3'],
      city: ['ship-city', 'shipping-city'],
      state: ['ship-state', 'shipping-state'],
      postalCode: ['ship-postal-code', 'shipping-postal-code'],
      country: ['ship-country', 'shipping-country'],
    },
  },
  SHOPIFY: {
    name: 'Shopify',
    confidence: 90,
    patterns: {
      fullName: ['shipping_name', 'shipping name', 'name'],
      addressLine1: [
        'shipping_address1',
        'shipping address1',
        'shipping_street',
        'shipping street',
      ],
      addressLine2: ['shipping_address2', 'shipping address2'],
      city: ['shipping_city', 'shipping city'],
      state: ['shipping_province', 'shipping province'],
      postalCode: ['shipping_zip', 'shipping zip'],
      country: ['shipping_country', 'shipping country'],
    },
  },
  EBAY: {
    name: 'eBay',
    confidence: 85,
    patterns: {
      fullName: ['buyer_name', 'buyer name', 'name'],
      addressLine1: ['street1', 'address_line_1'],
      addressLine2: ['street2', 'address_line_2'],
      city: ['city_name', 'city'],
      state: ['state_or_province', 'state'],
      postalCode: ['postal_code', 'zip_code'],
      country: ['country_name', 'country'],
    },
  },
  GENERIC: {
    name: 'Generic',
    confidence: 70,
    patterns: {
      firstName: ['first_name', 'firstname', 'prénom', 'prenom', 'given_name'],
      lastName: ['last_name', 'lastname', 'nom', 'family_name', 'surname'],
      fullName: ['name', 'full_name', 'nom_complet', 'customer_name', 'recipient'],
      addressLine1: ['address', 'address1', 'address_1', 'adresse', 'street', 'rue'],
      addressLine2: ['address2', 'address_2', 'adresse2', 'complement'],
      city: ['city', 'ville', 'town', 'locality'],
      state: ['state', 'province', 'region', 'état', 'etat'],
      postalCode: ['postal_code', 'zip', 'zip_code', 'code_postal', 'postcode'],
      country: ['country', 'pays', 'nation', 'country_name'],
    },
  },
} as const

// Fonctions utilitaires pour la normalisation
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeHeader(str1)
  const normalized2 = normalizeHeader(str2)

  // Correspondance exacte
  if (normalized1 === normalized2) return 100

  // Correspondances spéciales pour les headers Shopify exacts
  const shopifyExactMatches: Record<string, string[]> = {
    shipping_name: ['Shipping Name'],
    shipping_address1: ['Shipping Address1'],
    shipping_address2: ['Shipping Address2'],
    shipping_city: ['Shipping City'],
    shipping_zip: ['Shipping Zip'],
    shipping_country: ['Shipping Country'],
  }

  // Vérifier les correspondances exactes Shopify
  for (const [pattern, exactHeaders] of Object.entries(shopifyExactMatches)) {
    if (pattern === normalized2) {
      for (const exact of exactHeaders) {
        if (normalizeHeader(exact) === normalized1) {
          return 100
        }
      }
    }
  }

  // Correspondance par inclusion
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 80
  }

  // Distance de Levenshtein simplifiée
  const maxLength = Math.max(normalized1.length, normalized2.length)
  const distance = levenshteinDistance(normalized1, normalized2)
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.max(0, similarity)
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Fonction principale de détection des colonnes
export function detectColumns(headers: string[]): DetectionResult {
  const normalizedHeaders = headers.map(normalizeHeader)
  let bestResult: DetectionResult = {
    mapping: {},
    confidence: 0,
    platform: 'UNKNOWN',
    separator: '\t',
    hasHeaders: true,
  }

  // Tester chaque plateforme
  for (const [platformKey, platform] of Object.entries(PLATFORM_PATTERNS)) {
    const mapping: ColumnMapping = {}
    let totalMatches = 0
    let possibleMatches = 0

    // Pour chaque type de champ
    for (const [fieldKey, patterns] of Object.entries(platform.patterns)) {
      const field = fieldKey as keyof ColumnMapping
      possibleMatches++

      let bestMatch = -1
      let bestScore = 0

      // Tester chaque pattern contre chaque header
      for (const pattern of patterns) {
        for (let i = 0; i < normalizedHeaders.length; i++) {
          const similarity = calculateSimilarity(normalizedHeaders[i], pattern)

          if (similarity > bestScore && similarity >= 60) {
            // Seuil minimum de 60%
            bestScore = similarity
            bestMatch = i
          }
        }
      }

      if (bestMatch !== -1) {
        mapping[field] = bestMatch
        totalMatches++
      }
    }

    // Calculer la confiance pour cette plateforme
    const matchRatio = totalMatches / possibleMatches
    const platformConfidence = matchRatio * platform.confidence

    if (platformConfidence > bestResult.confidence) {
      bestResult = {
        mapping,
        confidence: platformConfidence,
        platform: platformKey as PlatformType,
        separator: '\t', // Par défaut, on détectera plus tard
        hasHeaders: true,
      }
    }
  }

  return bestResult
}

// Fonction pour détecter le séparateur
export function detectSeparator(line: string): string {
  const separators = ['\t', ',', ';', '|']
  const counts = separators.map((sep) => line.split(sep).length - 1)
  const maxCount = Math.max(...counts)
  const bestSeparatorIndex = counts.indexOf(maxCount)

  return separators[bestSeparatorIndex] || '\t'
}

// Fonction pour analyser un fichier et détecter sa structure
export function analyzeFileStructure(content: string): DetectionResult {
  const lines = content.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return {
      mapping: {},
      confidence: 0,
      platform: 'UNKNOWN',
      separator: '\t',
      hasHeaders: false,
    }
  }

  // Détecter le séparateur à partir de la première ligne
  const separator = detectSeparator(lines[0])

  // Extraire les headers potentiels avec un parsing plus robuste
  const potentialHeaders = parseHeadersRobustly(lines[0], separator)

  // Détecter les colonnes
  const detection = detectColumns(potentialHeaders)
  detection.separator = separator

  // Vérifier si la première ligne semble être des headers
  const hasHeaders = potentialHeaders.some(
    (header) => Number.isNaN(Number(header)) && header.length > 2
  )

  detection.hasHeaders = hasHeaders

  return detection
}

// Parser robuste pour les headers
function parseHeadersRobustly(line: string, separator: string): string[] {
  const headers = line.split(separator).map((h) => {
    let cleaned = h.trim()
    // Nettoyer les quotes
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1)
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1)
    }
    return cleaned
  })

  return headers
}
