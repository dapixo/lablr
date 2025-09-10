import type { Address, PrintFormat, PrintOptions } from '@/types/address'

export const PRINT_FORMATS: Record<PrintFormat, PrintOptions> = {
  A4: {
    format: 'A4',
    margin: 20,
    fontSize: 12,
  },
  A4_LABELS_10: {
    format: 'A4_LABELS_10',
    margin: 10,
    fontSize: 10,
  },
  ROLL_57x32: {
    format: 'ROLL_57x32',
    margin: 2,
    fontSize: 9,
  },
  A4_LABELS_21: {
    format: 'A4_LABELS_21',
    margin: 8,
    fontSize: 9,
  },
  A4_COMPACT: {
    format: 'A4_COMPACT',
    margin: 15,
    fontSize: 10,
  },
  CSV_EXPORT: {
    format: 'CSV_EXPORT',
    margin: 0,
    fontSize: 0,
  },
}

export const PRINT_FORMAT_LABELS: Record<PrintFormat, string> = {
  A4: 'A4 - Format standard',
  A4_LABELS_10: 'A4 - 10 étiquettes autocollantes (105×57mm)',
  ROLL_57x32: 'Rouleau - Étiquettes 57×32mm',
  A4_LABELS_21: 'A4 - 21 étiquettes Avery (70×42.3mm)',
  A4_COMPACT: 'A4 - Format compact (2 colonnes)',
  CSV_EXPORT: 'Export CSV - Données tabulaires',
}

export function getPrintCSS(format: PrintFormat): string {
  const options = PRINT_FORMATS[format]

  switch (format) {
    case 'A4':
      return `
        @page {
          size: A4;
          margin: ${options.margin}mm;
        }
        .address-item {
          font-size: ${options.fontSize}px;
          margin-bottom: 20px;
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          page-break-inside: avoid;
        }
      `

    case 'A4_LABELS_10':
      return `
        @page {
          size: A4;
          margin: ${options.margin}mm;
        }
        .labels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 8mm;
          row-gap: 3mm;
          height: 100vh;
        }
        .address-item {
          font-size: ${options.fontSize}px;
          padding: 4mm;
          height: 57mm;
          width: 105mm;
          box-sizing: border-box;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: transparent;
          overflow: hidden;
        }
        .address-item div {
          margin: 1mm 0;
          line-height: 1.2;
          word-wrap: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
        .address-item .address-name {
          font-weight: bold;
          color: #000;
        }
        .address-item .address-line {
          color: #374151;
        }
        .address-item .address-country {
          font-weight: 600;
          color: #111827;
        }
        .address-item:nth-child(10n) {
          page-break-after: always;
        }
      `

    case 'ROLL_57x32':
      return `
        @page {
          size: 57mm 32mm;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          width: 57mm;
          height: 32mm;
          overflow: hidden;
        }
        .address-item {
          font-size: ${options.fontSize}px;
          height: 32mm;
          width: 57mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2mm;
          break-after: page;
        }
        .address-item div {
          margin: 0.3mm 0;
          line-height: 1.0;
          word-wrap: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          font-size: ${options.fontSize}px;
        }
        .address-item .address-name {
          font-weight: bold;
          color: #000;
          font-size: ${Math.max(options.fontSize - 1, 8)}px;
          margin-bottom: 0.5mm;
        }
        .address-item .address-line {
          color: #374151;
          font-size: ${Math.max(options.fontSize - 2, 7)}px;
        }
        .address-item .address-country {
          font-weight: 600;
          color: #111827;
          font-size: ${Math.max(options.fontSize - 1, 8)}px;
          margin-top: 0.5mm;
        }
      `


    case 'A4_LABELS_21':
      return `
        @page {
          size: A4;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-size: 0; /* Supprime l'espacement entre inline-block */
        }
        .labels-grid {
          display: block;
          width: 210mm;
          height: 297mm;
          font-size: 0; /* Supprime l'espacement entre inline-block */
        }
        .address-item {
          font-size: ${options.fontSize}px;
          width: 70mm;
          height: 42.4mm;
          padding: 1.5mm;
          display: inline-block;
          vertical-align: top;
          overflow: hidden;
          box-sizing: border-box;
          text-align: center;
          margin: 0;
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .address-item:nth-child(7n+1) { clear: left; }
        .address-item:nth-child(21n) {
          page-break-after: always;
        }
        .address-item div {
          margin: 0.3mm 0;
          line-height: 1.1;
          word-wrap: break-word;
          overflow: hidden;
          width: 100%;
          font-size: ${options.fontSize}px;
        }
        .address-item .address-name {
          font-weight: bold;
          color: #000;
          margin-bottom: 0.5mm;
        }
        .address-item .address-line {
          color: #374151;
        }
        .address-item .address-country {
          font-weight: 600;
          color: #111827;
          margin-top: 0.5mm;
        }
      `

    case 'A4_COMPACT':
      return `
        @page {
          size: A4;
          margin: ${options.margin}mm;
        }
        * {
          box-sizing: border-box;
        }
        .compact-grid {
          display: block;
          width: 100%;
          overflow: hidden;
        }
        .address-item {
          font-size: ${options.fontSize}px;
          padding: 5mm;
          margin-bottom: 5mm;
          border: 1px solid #e5e7eb;
          border-radius: 2mm;
          page-break-inside: avoid;
          background: #fafafa;
          float: left;
          width: calc(50% - 5mm);
        }
        .address-item:nth-child(odd) {
          margin-right: 10mm;
          clear: both;
        }
        .address-item:nth-child(even) {
          margin-right: 0;
        }
        .address-item div {
          margin: 1mm 0;
          line-height: 1.3;
          word-wrap: break-word;
          font-size: ${options.fontSize}px;
        }
        .address-item .address-name {
          font-weight: bold;
          color: #000;
          font-size: ${options.fontSize + 1}px;
          margin-bottom: 2mm;
        }
        .address-item .address-line {
          color: #374151;
        }
        .address-item .address-country {
          font-weight: 600;
          color: #111827;
          margin-top: 2mm;
        }
      `


    case 'CSV_EXPORT':
      return `
        /* CSV Export - pas de style d'impression nécessaire */
        body { font-family: monospace; }
      `

    default:
      return ''
  }
}

// Fonction spéciale pour l'export CSV
export function generateCSV(addresses: Address[]): string {
  const headers = ['Prénom', 'Nom', 'Adresse 1', 'Adresse 2', 'Code Postal', 'Ville', 'Pays']
  
  const csvContent = [
    headers.join(','),
    ...addresses.map(addr => [
      `"${addr.firstName}"`,
      `"${addr.lastName}"`,
      `"${addr.addressLine1}"`,
      `"${addr.addressLine2 || ''}"`,
      `"${addr.postalCode}"`,
      `"${addr.city}"`,
      `"${addr.country}"`
    ].join(','))
  ].join('\n')
  
  return csvContent
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
