import { PRINT_DELAY_MS } from '@/constants'
import type { Address, PrintFormat } from '@/types/address'
import { generateAddressesHTML as generateHTML } from '@/lib/print/html-generator'
import { generateCSV } from '@/lib/print-formats'

/**
 * Génère le HTML pour l'impression des adresses selon le format spécifié
 * @deprecated Utiliser generateHTML depuis html-generator.ts
 */
export function generateAddressesHTML(addresses: Address[], format: PrintFormat): string {
  return generateHTML(addresses, format)
}

/**
 * Lance l'impression directement depuis la page actuelle sans ouvrir d'onglet
 */
export function printAddresses(addresses: Address[], format: PrintFormat, printCSS: string): void {
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

// Fonction pour télécharger le CSV
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
