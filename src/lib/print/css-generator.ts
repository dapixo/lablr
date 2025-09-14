import type { PrintFormat } from '@/types/address'
import { PRINT_CONFIGS } from './config'

// Mixins CSS réutilisables
interface CSSMixins {
  pageBase: (margin: string) => string
  bodyReset: () => string
  addressItem: (fontSize: number, padding?: string) => string
  addressContent: () => string
  gridLayout: (columns: number, rows?: number, width?: string, height?: string) => string
  labelItem: (width: string, height: string, fontSize: number) => string
  compactLayout: () => string
  rollLayout: (width: string, height: string) => string
  pageBreaks: (itemsPerPage: number) => string
}

const CSS_MIXINS: CSSMixins = {
  pageBase: (margin) => `
    @page {
      size: A4;
      margin: ${margin};
    }`,

  bodyReset: () => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
    }`,

  addressItem: (fontSize, padding = '2mm') => `
    .address-item {
      font-size: ${fontSize}px;
      padding: ${padding};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      overflow: hidden;
      box-sizing: border-box;
      margin: 0;
      page-break-inside: avoid;
    }`,

  addressContent: () => `
    .address-item div {
      margin: 0.2mm 0;
      line-height: 1.1;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      overflow: hidden;
      width: 100%;
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
    }`,

  gridLayout: (columns, rows, width, height) => {
    let css = `
      .labels-grid {
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 0;
      }`

    if (rows && width && height) {
      const totalWidth = parseFloat(width) * columns
      const totalHeight = parseFloat(height) * rows
      const columnTemplate = Array(columns).fill(width).join(' ')
      css += `
      .labels-grid {
        grid-template-columns: ${columnTemplate};
        grid-template-rows: repeat(${rows}, ${height});
        height: ${totalHeight}mm;
        width: ${totalWidth}mm;
      }`
    }

    return css
  },

  labelItem: (width, height, fontSize) => `
    .address-item {
      width: ${width};
      height: ${height};
      font-size: ${fontSize}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
    }`,

  compactLayout: () => `
    .compact-grid {
      display: block;
      width: 100%;
      overflow: hidden;
    }
    .address-item {
      padding: 5mm;
      margin-bottom: 5mm;
      border: 1px solid #e5e7eb;
      border-radius: 2mm;
      float: left;
      width: calc(50% - 5mm);
      box-sizing: border-box;
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
    }
    .address-item .address-name {
      font-size: calc(1em + 1px);
      margin-bottom: 2mm;
    }
    .address-item .address-country {
      margin-top: 2mm;
    }`,

  rollLayout: (width, height) => `
    @page {
      size: ${width} ${height};
      margin: 0;
    }
    body {
      width: ${width};
      height: ${height};
      overflow: hidden;
      border: none;
    }
    .address-item {
      height: ${height};
      width: ${width};
      break-after: page;
      box-sizing: border-box;
    }
    .address-item div {
      margin: 0.3mm 0;
      line-height: 1.0;
    }
    .address-item .address-name {
      font-weight: bold;
      margin-bottom: 0.5mm;
    }
    .address-item .address-country {
      margin-top: 0.5mm;
    }`,

  pageBreaks: (itemsPerPage) => `
    .address-item:nth-child(${itemsPerPage}n) {
      page-break-after: always;
    }`,
}

// Générateur CSS principal
export function generatePrintCSS(format: PrintFormat): string {
  const config = PRINT_CONFIGS[format]
  const { pageSettings, layout, styling } = config

  // CSS de base commun
  let css = ''

  // Gestion spéciale pour le format rouleau
  if (layout.type === 'roll' && styling.dimensions) {
    css += CSS_MIXINS.rollLayout(styling.dimensions.width, styling.dimensions.height)
    css += CSS_MIXINS.addressItem(pageSettings.fontSize, '2mm')
    css += CSS_MIXINS.addressContent()
    return css
  }

  // Page de base
  const margin = pageSettings.specialMargins || `${pageSettings.margin}mm`
  css += CSS_MIXINS.pageBase(margin)
  css += CSS_MIXINS.bodyReset()

  // Layout spécifique
  switch (layout.type) {
    case 'grid':
      if (styling.dimensions && layout.columns && layout.rows) {
        css += CSS_MIXINS.gridLayout(
          layout.columns,
          layout.rows,
          styling.dimensions.width,
          styling.dimensions.height
        )
        css += CSS_MIXINS.labelItem(
          styling.dimensions.width,
          styling.dimensions.height,
          pageSettings.fontSize
        )
      } else {
        css += CSS_MIXINS.gridLayout(layout.columns || 2)
        css += CSS_MIXINS.addressItem(pageSettings.fontSize)
      }
      break

    case 'compact':
      css += CSS_MIXINS.compactLayout()
      css += CSS_MIXINS.addressItem(pageSettings.fontSize, '5mm')
      break
    default:
      css += CSS_MIXINS.addressItem(pageSettings.fontSize, '10px')
      css += `
        .address-item {
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }`
      break
  }

  // Contenu des adresses
  css += CSS_MIXINS.addressContent()

  // Sauts de page
  if (layout.itemsPerPage && layout.itemsPerPage > 1) {
    css += CSS_MIXINS.pageBreaks(layout.itemsPerPage)
  }

  return css
}

// Export de la fonction principale pour compatibilité
export { generatePrintCSS as getPrintCSS }
