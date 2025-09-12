// Re-export des nouvelles configurations pour compatibilité
export {
  PRINT_CONFIGS as PRINT_FORMATS,
  PRINT_FORMAT_DESCRIPTIONS,
  PRINT_FORMAT_ICONS,
  PRINT_FORMAT_LABELS,
  PRINT_FORMAT_ORDER,
} from '@/lib/print/config'

// Re-export du générateur CSS pour compatibilité
export { generatePrintCSS as getPrintCSS } from '@/lib/print/css-generator'

// Re-export des utilitaires pour compatibilité
export { generateAddressesHTML } from '@/lib/print-utils'

import type { Address } from '@/types/address'

// Fonction spéciale pour l'export CSV (conservée pour compatibilité)
export function generateCSV(addresses: Address[]): string {
  const headers = ['Prénom', 'Nom', 'Adresse 1', 'Adresse 2', 'Code Postal', 'Ville', 'Pays']

  const csvContent = [
    headers.join(','),
    ...addresses.map((addr) =>
      [
        `"${addr.firstName}"`,
        `"${addr.lastName}"`,
        `"${addr.addressLine1}"`,
        `"${addr.addressLine2 || ''}"`,
        `"${addr.postalCode}"`,
        `"${addr.city}"`,
        `"${addr.country}"`,
      ].join(',')
    ),
  ].join('\n')

  return csvContent
}

// Fonction pour télécharger le CSV (conservée pour compatibilité)
export function downloadCSV(addresses: Address[], filename: string = 'addresses.csv'): void {
  const csvContent = generateCSV(addresses)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
