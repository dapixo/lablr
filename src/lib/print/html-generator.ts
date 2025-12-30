import type { Address, PrintFormat } from '@/types/address'
import { PRINT_CONFIGS } from './config'

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Génère le template HTML d'une adresse
 */
function generateAddressTemplate(address: Address): string {
  return `
    <div class="address-name">${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}</div>
    <div class="address-line">${escapeHtml(address.addressLine1)}</div>
    ${address.addressLine2 ? `<div class="address-line">${escapeHtml(address.addressLine2)}</div>` : ''}
    <div class="address-line">${escapeHtml(address.postalCode)} ${escapeHtml(address.city)}</div>
    <div class="address-country">${escapeHtml(address.country)}</div>
  `
}

/**
 * Génère le wrapper d'un item d'adresse selon le format
 */
function wrapAddressItem(content: string, format: PrintFormat): string {
  const config = PRINT_CONFIGS[format]

  switch (format) {
    case 'A4':
      return `<div class="${config.styling.itemClass}">
        <div><strong>${content.replace('<div class="address-name">', '').split('</div>')[0]}</strong></div>
        ${content.replace(/<div class="address-name">.*?<\/div>/, '')}
      </div>`

    default:
      return `<div class="${config.styling.itemClass}">${content}</div>`
  }
}

/**
 * Génère une étiquette vide pour combler les positions déjà utilisées
 */
function generateEmptyLabel(): string {
  return '<div class="label-item label-empty"></div>'
}

/**
 * Génère le HTML complet pour l'impression des adresses
 * @param addresses - Tableau des adresses à imprimer
 * @param format - Format d'impression
 * @param offset - Nombre d'étiquettes vides à insérer au début (pour planches partiellement utilisées)
 */
export function generateAddressesHTML(
  addresses: Address[],
  format: PrintFormat,
  offset: number = 0
): string {
  const config = PRINT_CONFIGS[format]

  // Génération des étiquettes vides pour l'offset (seulement pour les grilles)
  const emptyLabels = config.layout.type === 'grid' && offset > 0
    ? Array(offset).fill(null).map(() => generateEmptyLabel()).join('')
    : ''

  // Génération du contenu des adresses
  const addressesContent = addresses
    .map((address) => {
      const template = generateAddressTemplate(address)
      return wrapAddressItem(template, format)
    })
    .join('')

  // Combinaison des étiquettes vides + adresses
  const fullContent = emptyLabels + addressesContent

  // Wrapper selon le type de layout
  switch (config.layout.type) {
    case 'grid':
      return `<div class="${config.styling.containerClass}">${fullContent}</div>`

    case 'compact':
      return `<div class="${config.styling.containerClass}">${fullContent}</div>`

    case 'roll':
      return fullContent // Pas de wrapper pour le rouleau
    default:
      return fullContent // Pas de wrapper pour les listes
  }
}

/**
 * Fonction pour la compatibilité avec l'ancien système
 * @deprecated Utiliser generateAddressesHTML à la place
 */
export { generateAddressesHTML as generateHTML }
