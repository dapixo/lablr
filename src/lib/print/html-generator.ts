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
 * Génère le HTML complet pour l'impression des adresses
 */
export function generateAddressesHTML(addresses: Address[], format: PrintFormat): string {
  const config = PRINT_CONFIGS[format]
  
  // Génération du contenu des adresses
  const addressesContent = addresses
    .map(address => {
      const template = generateAddressTemplate(address)
      return wrapAddressItem(template, format)
    })
    .join('')

  // Wrapper selon le type de layout
  switch (config.layout.type) {
    case 'grid':
      return `<div class="${config.styling.containerClass}">${addressesContent}</div>`
    
    case 'compact':
      return `<div class="${config.styling.containerClass}">${addressesContent}</div>`
    
    case 'roll':
      return addressesContent // Pas de wrapper pour le rouleau
    
    case 'list':
    default:
      return addressesContent // Pas de wrapper pour les listes
  }
}

/**
 * Fonction pour la compatibilité avec l'ancien système
 * @deprecated Utiliser generateAddressesHTML à la place
 */
export { generateAddressesHTML as generateHTML }