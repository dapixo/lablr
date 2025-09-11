import type { ColumnMapping } from './column-detector'

// Patterns universels pour trouver les colonnes d'adresses
const COLUMN_PATTERNS = {
  name: [
    // Privilégier les colonnes shipping/billing d'abord
    'shipping_name',
    'billing_name',
    'recipient_name',
    'ship_to_name',
    'buyer_name',
    // Puis les noms génériques
    'full_name',
    'customer_name',
    'contact_name',
    'nom_complet',
    // Et enfin "name" générique en dernier
    'name',
    'nom',
  ],
  firstName: [
    'first_name',
    'firstname',
    'given_name',
    'prénom',
    'prenom',
    'shipping_first_name',
    'billing_first_name',
  ],
  lastName: [
    'last_name',
    'lastname',
    'family_name',
    'surname',
    'nom_famille',
    'shipping_last_name',
    'billing_last_name',
  ],
  address1: [
    'address',
    'address1',
    'address_1',
    'street',
    'street1',
    'adresse',
    'rue',
    'shipping_address1',
    'billing_address1',
    'ship_address_1',
    'ship_address1',
    'street_address',
    'address_line_1',
  ],
  address2: [
    'address2',
    'address_2',
    'street2',
    'adresse2',
    'complement_adresse',
    'shipping_address2',
    'billing_address2',
    'ship_address_2',
    'ship_address2',
    'address_line_2',
  ],
  city: [
    'city',
    'ville',
    'town',
    'locality',
    'city_name',
    'shipping_city',
    'billing_city',
    'ship_city',
  ],
  postalCode: [
    'postal_code',
    'zip',
    'zip_code',
    'code_postal',
    'postcode',
    'zipcode',
    'shipping_zip',
    'billing_zip',
    'ship_postal_code',
    'postal',
  ],
  state: [
    'state',
    'province',
    'region',
    'état',
    'etat',
    'shipping_province',
    'billing_province',
    'ship_state',
  ],
  country: [
    'country',
    'pays',
    'nation',
    'country_name',
    'shipping_country',
    'billing_country',
    'ship_country',
  ],
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function findColumnMatch(headers: string[], patterns: string[]): number {
  const normalizedHeaders = headers.map((h) => normalizeColumnName(h))

  // Chercher correspondance exacte d'abord
  for (const pattern of patterns) {
    const normalizedPattern = normalizeColumnName(pattern)
    const exactIndex = normalizedHeaders.findIndex((h) => h === normalizedPattern)
    if (exactIndex !== -1) {
      return exactIndex
    }
  }

  // Chercher correspondance partielle
  for (const pattern of patterns) {
    const normalizedPattern = normalizeColumnName(pattern)
    const partialIndex = normalizedHeaders.findIndex(
      (h) => h.includes(normalizedPattern) || normalizedPattern.includes(h)
    )
    if (partialIndex !== -1) {
      return partialIndex
    }
  }

  return -1
}

export function findAddressColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}

  // Helper function to set mapping if found
  const setIfFound = (field: keyof ColumnMapping, patterns: string[]) => {
    const index = findColumnMatch(headers, patterns)
    if (index !== -1) {
      mapping[field] = index
    }
  }

  // Chercher nom complet d'abord, sinon prénom/nom séparés
  const nameIndex = findColumnMatch(headers, COLUMN_PATTERNS.name)
  if (nameIndex !== -1) {
    mapping.fullName = nameIndex
  } else {
    setIfFound('firstName', COLUMN_PATTERNS.firstName)
    setIfFound('lastName', COLUMN_PATTERNS.lastName)
  }

  // Adresses et autres champs
  setIfFound('addressLine1', COLUMN_PATTERNS.address1)
  setIfFound('addressLine2', COLUMN_PATTERNS.address2)
  setIfFound('city', COLUMN_PATTERNS.city)
  setIfFound('postalCode', COLUMN_PATTERNS.postalCode)
  setIfFound('state', COLUMN_PATTERNS.state)
  setIfFound('country', COLUMN_PATTERNS.country)

  return mapping
}
