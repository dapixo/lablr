import type { Address, ParsedAddresses } from '@/types/address'

export function parseAmazonSellerReport(content: string): ParsedAddresses {
  const addresses: Address[] = []
  const errors: string[] = []
  const seenAddresses = new Set<string>() // Pour éviter les doublons

  // Split content into lines and remove empty lines
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Skip header line if it exists
  const dataLines = lines.filter((line, index) => {
    // Skip if it's the first line and contains column headers
    if (index === 0 && line.includes('order-id')) {
      return false
    }
    return true
  })

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]

    try {
      // Split by tabs (TSV format) - Amazon uses tab-separated values
      const columns = line.split('\t')

      // Extract address information from Amazon columns
      // Based on Amazon seller report format:
      // [16] recipient-name, [17] ship-address-1, [18] ship-address-2, [19] ship-address-3,
      // [20] ship-city, [21] ship-state, [22] ship-postal-code, [23] ship-country
      const recipientName = columns[16]?.trim() || ''
      const shipAddress1 = columns[17]?.trim() || ''
      const shipAddress2 = columns[18]?.trim() || ''
      const shipAddress3 = columns[19]?.trim() || ''
      const shipCity = columns[20]?.trim() || ''
      const shipState = columns[21]?.trim() || ''
      const shipPostalCode = columns[22]?.trim() || ''
      const shipCountry = columns[23]?.trim() || ''

      // Skip if no recipient name or address
      if (!recipientName || !shipAddress1) {
        continue
      }

      // Parse recipient name
      const nameParts = recipientName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Build address lines
      const addressLine1 = shipAddress1
      let addressLine2: string | undefined

      // Combine address2 and address3 if they exist
      if (shipAddress2 && shipAddress3) {
        addressLine2 = `${shipAddress2}, ${shipAddress3}`
      } else if (shipAddress2) {
        addressLine2 = shipAddress2
      } else if (shipAddress3) {
        addressLine2 = shipAddress3
      }

      // Build city with state if available
      let city = shipCity
      if (shipState && shipState !== shipCity) {
        city = `${shipCity} ${shipState}`.trim()
      }

      // Create unique key to avoid duplicates
      const addressKey =
        `${recipientName}-${shipAddress1}-${shipPostalCode}-${shipCity}`.toLowerCase()

      if (seenAddresses.has(addressKey)) {
        continue // Skip duplicate
      }

      const address: Address = {
        id: `address-${addresses.length + 1}`,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        postalCode: shipPostalCode,
        city,
        country: getCountryName(shipCountry),
      }

      // Validate address has minimum required fields
      if (isValidAddress(address)) {
        addresses.push(address)
        seenAddresses.add(addressKey)
      }
    } catch {
      errors.push(`Erreur ligne ${i + 1}: Format invalide`)
    }
  }

  return { addresses, errors }
}

function isValidAddress(address: Partial<Address>): address is Address {
  return !!(
    address.firstName &&
    address.addressLine1 &&
    address.postalCode &&
    address.city &&
    address.country
  )
}

function getCountryName(countryCode: string): string {
  const countryCodes: Record<string, string> = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
    US: 'États-Unis',
    DE: 'Allemagne',
    IT: 'Italie',
    ES: 'Espagne',
    GB: 'Royaume-Uni',
    NL: 'Pays-Bas',
  }

  return countryCodes[countryCode.toUpperCase()] || countryCode || 'France'
}

// Fonction utilitaire pour nettoyer les adresses
export function cleanAddressData(addresses: Address[]): Address[] {
  return addresses.map((address) => ({
    ...address,
    firstName: address.firstName.trim(),
    lastName: address.lastName.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: address.addressLine2?.trim(),
    postalCode: address.postalCode.trim(),
    city: address.city.trim(),
    country: address.country.trim(),
  }))
}
