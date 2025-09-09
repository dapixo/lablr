import { PRINT_DELAY_MS } from '@/constants'
import type { Address, PrintFormat } from '@/types/address'

/**
 * Génère le HTML pour l'impression des adresses selon le format spécifié
 */
export function generateAddressesHTML(addresses: Address[], format: PrintFormat): string {
  if (format === 'A4_LABELS_10') {
    return `
      <div class="labels-grid">
        ${addresses
          .map(
            (address) => `
          <div class="address-item">
            <div class="address-name">${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}</div>
            <div class="address-line">${escapeHtml(address.addressLine1)}</div>
            ${address.addressLine2 ? `<div class="address-line">${escapeHtml(address.addressLine2)}</div>` : ''}
            <div class="address-line">${escapeHtml(address.postalCode)} ${escapeHtml(address.city)}</div>
            <div class="address-country">${escapeHtml(address.country)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
  }

  if (format === 'ROLL_57x32') {
    return addresses
      .map(
        (address) => `
        <div class="address-item">
          <div class="address-name">${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}</div>
          <div class="address-line">${escapeHtml(address.addressLine1)}</div>
          ${address.addressLine2 ? `<div class="address-line">${escapeHtml(address.addressLine2)}</div>` : ''}
          <div class="address-line">${escapeHtml(address.postalCode)} ${escapeHtml(address.city)}</div>
          <div class="address-country">${escapeHtml(address.country)}</div>
        </div>
      `
      )
      .join('')
  }

  // Format A4 par défaut
  return addresses
    .map(
      (address) => `
      <div class="address-item">
        <div><strong>${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}</strong></div>
        <div>${escapeHtml(address.addressLine1)}</div>
        ${address.addressLine2 ? `<div>${escapeHtml(address.addressLine2)}</div>` : ''}
        <div>${escapeHtml(address.postalCode)} ${escapeHtml(address.city)}</div>
        <div>${escapeHtml(address.country)}</div>
      </div>
    `
    )
    .join('')
}

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
 * Lance l'impression directement depuis la page actuelle sans ouvrir d'onglet
 */
export function printAddresses(
  addresses: Address[], 
  format: PrintFormat,
  printCSS: string
): void {
  // Créer un ID unique pour cette session d'impression
  const printSessionId = `lablr-print-${Date.now()}`
  const printStyleId = `${printSessionId}-styles`
  const printContentId = `${printSessionId}-content`
  
  // Sauvegarder le titre original
  const originalTitle = document.title
  
  // Créer le style d'impression
  const printStyleElement = document.createElement('style')
  printStyleElement.id = printStyleId
  document.head.appendChild(printStyleElement)

  // Générer le HTML des adresses
  const addressesHTML = generateAddressesHTML(addresses, format)

  // Appliquer les styles d'impression
  printStyleElement.textContent = `
    @media print {
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.4;
        color: #000;
      }
      ${printCSS}
      
      /* Masquer tout le contenu de la page sauf notre contenu d'impression */
      body > *:not(#${printContentId}) {
        display: none !important;
      }
      
      #${printContentId} {
        display: block !important;
      }
    }
    
    /* Sur l'écran, masquer le contenu d'impression */
    @media screen {
      #${printContentId} {
        display: none !important;
        position: absolute;
        left: -9999px;
        top: -9999px;
      }
    }
  `

  // Changer le titre de la page
  document.title = 'Impression des adresses - Lablr'

  // Créer le conteneur d'impression (invisible sur l'écran)
  const printContainer = document.createElement('div')
  printContainer.id = printContentId
  printContainer.innerHTML = addressesHTML
  document.body.appendChild(printContainer)

  // Écouter la fin de l'impression pour nettoyer
  const cleanupPrint = () => {
    // Restaurer le titre original
    document.title = originalTitle
    
    // Supprimer le contenu d'impression
    const contentElement = document.getElementById(printContentId)
    if (contentElement) {
      contentElement.remove()
    }
    
    // Supprimer les styles d'impression
    const styleElement = document.getElementById(printStyleId)
    if (styleElement) {
      styleElement.remove()
    }
    
    // Supprimer l'event listener
    window.removeEventListener('afterprint', cleanupPrint)
  }

  // Écouter la fin de l'impression
  window.addEventListener('afterprint', cleanupPrint)

  // Lancer l'impression après un délai
  setTimeout(() => {
    window.print()
  }, PRINT_DELAY_MS)
}

