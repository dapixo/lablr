import type { PrintFormat, PrintOptions } from '@/types/address'

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
}

export const PRINT_FORMAT_LABELS: Record<PrintFormat, string> = {
  A4: 'A4 - Format standard',
  A4_LABELS_10: 'A4 - 10 étiquettes autocollantes (105×57mm)',
  ROLL_57x32: 'Rouleau - Étiquettes 57×32mm',
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

    default:
      return ''
  }
}
