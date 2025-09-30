import type { Address, ParsedAddresses } from '@/types/address'
import { type ColumnMapping, type DetectionResult, detectSeparator } from './column-detector'
import { findAddressColumns } from './direct-column-finder'

export interface UniversalParseResult extends ParsedAddresses {
  detection: DetectionResult
  confidence: number
  platform: string
}

// Fonction principale de parsing universel
export function parseUniversalFile(content: string): UniversalParseResult {
  const addresses: Address[] = []
  const errors: string[] = []

  // Split content into lines
  const lines = content.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return {
      addresses: [],
      errors: ['Fichier vide'],
      detection: {
        mapping: {},
        confidence: 0,
        platform: 'UNKNOWN',
        separator: ',',
        hasHeaders: false,
      },
      confidence: 0,
      platform: 'UNKNOWN',
    }
  }

  // Détecter le séparateur simplement
  const separator = detectSeparator(lines[0])

  // Extraire et nettoyer les headers avec le parser CSV
  const headers = parseCSVLine(lines[0], separator)

  // Chercher directement les colonnes d'adresses
  const mapping = findAddressColumns(headers)

  // Créer un objet detection simple
  const detection: DetectionResult = {
    mapping,
    confidence: 100, // Confiance maximale pour la recherche directe
    platform: 'UNIVERSAL',
    separator,
    hasHeaders: true,
  }

  // Déterminer la ligne de début des données (skip headers)
  const dataLines = lines.slice(1)

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]

    try {
      // Parsing CSV plus robuste pour gérer les quotes et virgules
      const columns = parseCSVLine(line, detection.separator)

      // Extraire les données selon le mapping détecté
      const extractedData = extractAddressFromColumns(columns, detection.mapping, headers)

      if (!extractedData) {
        continue // Skip si pas assez de données
      }

      const address: Address = {
        id: `address-${addresses.length + 1}`,
        firstName: extractedData.firstName || '',
        lastName: extractedData.lastName || '',
        addressLine1: extractedData.addressLine1 || '',
        addressLine2: extractedData.addressLine2,
        postalCode: extractedData.postalCode || '',
        city: extractedData.city || '',
        country: extractedData.country || 'France',
      }

      if (isValidAddress(address)) {
        addresses.push(address)
      }
    } catch (error) {
      errors.push(
        `Erreur ligne ${i + 2}: ${error instanceof Error ? error.message : 'Format invalide'}`
      )
    }
  }

  // Note: Le message "aucune adresse trouvée" est maintenant géré par la Stats Card dans l'UI

  return {
    addresses,
    errors,
    detection,
    confidence: detection.confidence,
    platform: detection.platform,
  }
}

// Correction du mapping quand les données ont moins de colonnes que les headers
function correctMappingForMissingColumns(
  mapping: ColumnMapping,
  headers: string[],
  columns: string[]
): ColumnMapping {
  // Si les données ont le même nombre de colonnes que les headers, pas de correction
  if (columns.length >= headers.length) {
    return mapping
  }

  // Détection du pattern Amazon Seller avec colonnes manquantes
  if (headers.length === 29 && columns.length === 20) {
    // Pattern typique: 9 colonnes manquantes à la fin du fichier Amazon
    // Les colonnes d'adresse sont décalées vers la gauche

    const correctedMapping: ColumnMapping = { ...mapping }

    // Ajustement spécifique pour Amazon Seller avec 20 colonnes au lieu de 29
    if (mapping.fullName === 16) correctedMapping.fullName = 15  // recipient-name
    if (mapping.addressLine1 === 17) correctedMapping.addressLine1 = 16  // ship-address-1
    if (mapping.addressLine2 === 18) correctedMapping.addressLine2 = undefined  // ship-address-2 souvent vide
    if (mapping.city === 20) correctedMapping.city = 17  // ship-city
    if (mapping.postalCode === 22) correctedMapping.postalCode = 18  // ship-postal-code
    if (mapping.country === 23) correctedMapping.country = 19  // ship-country

    return correctedMapping
  }

  // Autres patterns de correction peuvent être ajoutés ici
  return mapping
}

// Extraction des données d'adresse à partir des colonnes
function extractAddressFromColumns(
  columns: string[],
  mapping: ColumnMapping,
  headers: string[]
): Partial<Address> | null {
  const data: Partial<Address> = {}

  // Corriger le mapping si nécessaire
  const correctedMapping = correctMappingForMissingColumns(mapping, headers, columns)

  // Fonction helper pour obtenir une colonne de façon sûre
  const getColumn = (index: number | undefined): string => {
    if (index === undefined || index < 0 || index >= columns.length) {
      return ''
    }
    return columns[index]?.trim() || ''
  }

  // Extraction du nom
  if (correctedMapping.fullName !== undefined) {
    const fullName = getColumn(correctedMapping.fullName)
    if (fullName) {
      const nameParts = fullName.split(' ')
      data.firstName = nameParts[0] || ''
      data.lastName = nameParts.slice(1).join(' ') || ''
    }
  } else {
    data.firstName = getColumn(correctedMapping.firstName)
    data.lastName = getColumn(correctedMapping.lastName)
  }

  // Extraction de l'adresse - traiter directement les colonnes mappées
  const rawAddress1 = getColumn(correctedMapping.addressLine1)
  const rawAddress2 = getColumn(correctedMapping.addressLine2)

  // Déterminer s'il s'agit d'un fichier Shopify en analysant les headers
  const isShopify = columns.some(
    (_, idx) =>
      headers[idx]?.toLowerCase().includes('shipping street') ||
      headers[idx]?.toLowerCase().includes('shipping name')
  )

  // Logique spécifique pour Shopify
  if (isShopify && correctedMapping.addressLine1 !== undefined) {
    // Pour Shopify, essayer d'abord la colonne "Shipping Street" (une colonne avant Address1)
    const shippingStreetCol = getColumn(correctedMapping.addressLine1 - 1)

    if (
      shippingStreetCol &&
      shippingStreetCol.length > 10 &&
      !shippingStreetCol.includes('Payments') &&
      !shippingStreetCol.includes('Shopify Payments')
    ) {
      // Utiliser Shipping Street si elle contient une adresse complète
      data.addressLine1 = cleanAddressField(shippingStreetCol)
      data.addressLine2 =
        rawAddress2 && cleanAddressField(rawAddress2) !== data.addressLine1
          ? cleanAddressField(rawAddress2)
          : undefined
    } else {
      // Utiliser les colonnes mappées normalement
      data.addressLine1 = cleanAddressField(rawAddress1)
      if (rawAddress2) {
        data.addressLine2 = cleanAddressField(rawAddress2)
      }
    }
  } else if (rawAddress1?.includes('"') && rawAddress2) {
    // Cas de fragmentation CSV: recombiner Address1 et Address2
    const cleanAddr1 = cleanAddressField(rawAddress1)
    const cleanAddr2 = cleanAddressField(rawAddress2)

    if (cleanAddr1 && cleanAddr2) {
      data.addressLine1 = `${cleanAddr1}, ${cleanAddr2}`
      data.addressLine2 = undefined
    } else {
      data.addressLine1 = cleanAddr1 || cleanAddr2
    }
  } else {
    // Cas normal (Amazon, eBay, etc.) - utiliser directement les colonnes mappées
    data.addressLine1 = cleanAddressField(rawAddress1)
    if (rawAddress2) {
      data.addressLine2 = cleanAddressField(rawAddress2)
    }
  }

  // Extraction ville, état, code postal, pays
  const rawCity = getColumn(correctedMapping.city)
  const rawPostalCode = getColumn(correctedMapping.postalCode)
  const rawCountry = getColumn(correctedMapping.country)

  // Nettoyer la ville des données parasites
  data.city = cleanAddressField(rawCity)

  // Code postal avec nettoyage des quotes
  data.postalCode = rawPostalCode.replace(/^['"]|['"]$/g, '')

  // Pays
  data.country = normalizeCountry(rawCountry)

  // Validation stricte des champs requis
  const hasName =
    (data.firstName && data.firstName.length > 0) || (data.lastName && data.lastName.length > 0)
  const hasValidAddress = data.addressLine1 && data.addressLine1.length > 5
  const hasValidCity = data.city && data.city.length > 2
  const hasValidPostalCode = data.postalCode && data.postalCode.length >= 4

  if (!hasName || !hasValidAddress || !hasValidCity || !hasValidPostalCode) {
    return null
  }

  return data
}

// Normalisation des noms de pays
function normalizeCountry(country: string): string {
  if (!country) return 'France' // Par défaut

  const countryMap: Record<string, string> = {
    // Codes pays
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
    US: 'États-Unis',
    USA: 'États-Unis',
    DE: 'Allemagne',
    IT: 'Italie',
    ES: 'Espagne',
    GB: 'Royaume-Uni',
    UK: 'Royaume-Uni',
    NL: 'Pays-Bas',

    // Noms complets (normalisés)
    france: 'France',
    belgium: 'Belgique',
    switzerland: 'Suisse',
    canada: 'Canada',
    'united states': 'États-Unis',
    germany: 'Allemagne',
    italy: 'Italie',
    spain: 'Espagne',
    'united kingdom': 'Royaume-Uni',
    netherlands: 'Pays-Bas',
  }

  const normalized = country.toLowerCase().trim()
  return countryMap[normalized] || country || 'France'
}

// Validation d'adresse
function isValidAddress(address: Partial<Address>): address is Address {
  return !!(
    (address.firstName || address.lastName) &&
    address.addressLine1 &&
    address.postalCode &&
    address.city &&
    address.country
  )
}

// Fonction pour nettoyer les champs d'adresse
function cleanAddressField(field: string): string {
  if (!field) return ''

  let cleaned = field.trim()

  // Enlever les guillemets résiduels
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1)
  }

  // Si le champ contient des données parasites (chiffres seuls, noms de champs Shopify)
  if (
    /^[\d.]+$/.test(cleaned) || // Que des chiffres et points (shipping cost)
    cleaned.includes('Shopify Payments') ||
    cleaned.includes('Anasalsa Créations') ||
    cleaned.length > 200
  ) {
    // Trop long = probablement données parasites
    return ''
  }

  return cleaned
}

/**
 * Fonction de compatibilité avec l'ancien parser Amazon
 */
export async function parseAmazonSellerReportUniversal(content: string): Promise<ParsedAddresses> {
  const result = parseUniversalFile(content)

  // Si c'est bien un format Amazon avec haute confiance, renvoyer directement
  if (result.platform === 'AMAZON_SELLER' && result.confidence > 80) {
    return {
      addresses: result.addresses,
      errors: result.errors,
    }
  }

  // Sinon, essayer le parser Amazon classique en fallback
  const { parseAmazonSellerReport } = await import('./address-parser')
  return parseAmazonSellerReport(content)
}

/**
 * Nettoie les guillemets d'un champ CSV
 */
function cleanQuotes(field: string): string {
  const cleaned = field.trim()

  // Enlever les guillemets doubles ou simples
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1)
  }

  return cleaned
}

/**
 * Parse une ligne CSV en respectant les guillemets et échappements
 */
function parseCSVLine(line: string, separator: string): string[] {
  // Gestion spéciale pour les espaces multiples
  if (separator === 'MULTI_SPACE') {
    return line.split(/\s{2,}/).map((field) => cleanQuotes(field.trim())).filter(Boolean)
  }

  const columns: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quote = escaped quote
        current += '"'
        i += 2
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
        continue
      }
    }

    if (char === separator && !inQuotes) {
      // End of field
      columns.push(current.trim())
      current = ''
      i++
      continue
    }

    current += char
    i++
  }

  // Add last field
  columns.push(current.trim())

  return columns.map(cleanQuotes)
}

// Export des fonctions utilitaires
export type { ColumnMapping, DetectionResult } from './column-detector'
