import type { PrintFormat } from '@/types/address'
import { PRINT_CONFIGS, type LabelSpacing } from './config'

// Mixins CSS réutilisables
interface CSSMixins {
  pageBase: (margin: string) => string
  bodyReset: () => string
  addressItem: (fontSize: number, padding?: string, debugBorder?: string) => string
  addressContent: () => string
  gridLayout: (columns: number, rows?: number, width?: string, height?: string, debugBorder?: string, spacing?: LabelSpacing) => string
  labelItem: (width: string, height: string, fontSize: number, debugBorder?: string) => string
  compactLayout: (debugBorder?: string) => string
  rollLayout: (width: string, height: string, debugBorder?: string) => string
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

  addressItem: (fontSize, padding = '2mm', debugBorder = 'none') => `
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
      border: ${debugBorder};
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

  gridLayout: (columns, rows, width, height, debugBorder = 'none', spacing?: LabelSpacing) => {
    let css = `
      .labels-grid {
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 0;
        border: ${debugBorder === 'none' ? 'none' : '2px solid #0000ff'};
      }`

    if (rows && width && height) {
      // Utiliser les espacements précis si disponibles
      if (spacing) {
        const columnTemplate = Array(columns).fill(width).join(' ')
        const rowTemplate = Array(rows).fill(height).join(' ')

        css += `
        .labels-grid {
          grid-template-columns: ${columnTemplate};
          grid-template-rows: ${rowTemplate};
          gap: ${spacing.gapVertical} ${spacing.gapHorizontal};
          border: ${debugBorder === 'none' ? 'none' : '2px solid #0000ff'};
        }`
      } else {
        // Mode legacy
        const totalWidth = parseFloat(width) * columns
        const totalHeight = parseFloat(height) * rows
        const columnTemplate = Array(columns).fill(width).join(' ')
        css += `
        .labels-grid {
          grid-template-columns: ${columnTemplate};
          grid-template-rows: repeat(${rows}, ${height});
          height: ${totalHeight}mm;
          width: ${totalWidth}mm;
          border: ${debugBorder === 'none' ? 'none' : '2px solid #0000ff'};
        }`
      }
    }

    return css
  },

  labelItem: (width, height, fontSize, debugBorder = 'none') => `
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
      border: ${debugBorder};
    }`,

  compactLayout: (debugBorder = 'none') => `
    .compact-grid {
      display: block;
      width: 100%;
      overflow: hidden;
      border: ${debugBorder === 'none' ? 'none' : '2px solid #00ff00'};
    }
    .address-item {
      padding: 5mm;
      margin-bottom: 5mm;
      border: ${debugBorder === 'none' ? '1px solid #e5e7eb' : '1px solid #ff0000'};
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

  rollLayout: (width, height, debugBorder = 'none') => `
    @page {
      size: ${width} ${height};
      margin: 0;
    }
    body {
      width: ${width};
      height: ${height};
      overflow: hidden;
      border: ${debugBorder === 'none' ? 'none' : '2px solid #ff00ff'};
    }
    .address-item {
      height: ${height};
      width: ${width};
      break-after: page;
      box-sizing: border-box;
      border: ${debugBorder};
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
export function generatePrintCSS(format: PrintFormat, debug: boolean = false): string {
  const config = PRINT_CONFIGS[format]
  const { pageSettings, layout, styling } = config

  // CSS de base commun
  let css = ''

  // Bordures de debug si activées
  const debugBorder = debug ? '1px solid #ff0000' : 'none'

  // Gestion spéciale pour le format rouleau
  if (layout.type === 'roll' && styling.dimensions) {
    css += CSS_MIXINS.rollLayout(styling.dimensions.width, styling.dimensions.height, debugBorder)
    css += CSS_MIXINS.addressItem(pageSettings.fontSize, '2mm', debugBorder)
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
          styling.dimensions.height,
          debugBorder,
          styling.spacing
        )
        css += CSS_MIXINS.labelItem(
          styling.dimensions.width,
          styling.dimensions.height,
          pageSettings.fontSize,
          debugBorder
        )
      } else {
        css += CSS_MIXINS.gridLayout(layout.columns || 2, undefined, undefined, undefined, debugBorder)
        css += CSS_MIXINS.addressItem(pageSettings.fontSize, '2mm', debugBorder)
      }
      break

    case 'compact':
      css += CSS_MIXINS.compactLayout(debugBorder)
      css += CSS_MIXINS.addressItem(pageSettings.fontSize, '5mm', debugBorder)
      break
    default:
      css += CSS_MIXINS.addressItem(pageSettings.fontSize, '10px', debugBorder)
      css += `
        .address-item {
          margin-bottom: 20px;
          border-bottom: ${debug ? '2px solid #00ff00' : '1px solid #e5e7eb'};
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

// Fonction avec debug activé par défaut pour les tests
export function generateDebugPrintCSS(format: PrintFormat): string {
  return generatePrintCSS(format, true)
}
