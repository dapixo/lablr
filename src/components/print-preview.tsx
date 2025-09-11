'use client'

import { Eye, Settings } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'

import { PREVIEW_DIMENSIONS, PREVIEW_MAX_LABELS_ROLL, PREVIEW_MAX_PAGES } from '@/constants'
import { getPrintCSS, PRINT_FORMAT_LABELS, downloadCSV } from '@/lib/print-formats'
import { printAddresses } from '@/lib/print-utils'
import { STORAGE_KEYS, useCollapsiblePanel, usePersistedSelection } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Address, PrintFormat } from '@/types/address'

interface PrintPreviewProps {
  addresses: Address[]
  className?: string
}

export function PrintPreview({ addresses, className }: PrintPreviewProps) {
  // Fonction de validation pour les formats
  const isValidFormat = useCallback((value: string): value is PrintFormat => {
    return getOrderedFormats().includes(value as PrintFormat)
  }, [])

  // États avec hooks personnalisés
  const selectedFormat = usePersistedSelection(
    STORAGE_KEYS.SELECTED_FORMAT,
    'A4' as PrintFormat,
    isValidFormat
  )
  const printPanel = useCollapsiblePanel(STORAGE_KEYS.PRINT_PANEL_COLLAPSED, false)

  const handlePrint = () => {
    if (selectedFormat.value === 'CSV_EXPORT') {
      downloadCSV(addresses, 'adresses-lablr.csv')
      return
    }

    const printCSS = getPrintCSS(selectedFormat.value)
    printAddresses(addresses, selectedFormat.value, printCSS)
  }

  if (addresses.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Panel
        header={
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-semibold text-gray-900">Options d&apos;impression</span>
          </div>
        }
        className="w-full"
        toggleable
        collapsed={printPanel.isCollapsed}
        onToggle={printPanel.toggle}
      >
        <div className="mb-3 text-600 text-sm">
          Choisissez le format d&apos;impression pour vos {addresses.length} adresses
        </div>
        {/* Sélecteur de format */}
        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-900 mb-4">
              Format d&apos;impression
            </legend>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Choisir un format d'impression"
            >
              {getOrderedFormats().map((format) => (
                <FormatCard
                  key={format}
                  format={format}
                  isSelected={selectedFormat.value === format}
                  onSelect={selectedFormat.updateValue}
                />
              ))}
            </div>
          </fieldset>
        </div>

        {/* Actions */}
        <div className="flex justify-center mt-6 mb-4">
          <Button
            onClick={handlePrint}
            label={selectedFormat.value === 'CSV_EXPORT' ? 'Télécharger CSV' : 'Imprimer'}
            icon={selectedFormat.value === 'CSV_EXPORT' ? 'pi pi-download' : 'pi pi-print'}
            size="small"
            className="px-6"
          />
        </div>

        {/* Aperçu intégré */}
        {selectedFormat.value !== 'CSV_EXPORT' && (
          <div className="mt-2">
            <div className="text-sm font-semibold text-900 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu - {PRINT_FORMAT_LABELS[selectedFormat.value]}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Visualisation réaliste du rendu d&apos;impression (échelle réduite)
            </div>
            <div className="flex justify-center bg-gray-100 p-6 rounded-lg mb-4">
              <PrintPreviewSheet addresses={addresses} format={selectedFormat.value} />
            </div>
          </div>
        )}

        {/* Aperçu CSV intégré */}
        {selectedFormat.value === 'CSV_EXPORT' && (
          <div className="mt-2">
            <div className="text-sm font-semibold text-900 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu - Export CSV
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Prévisualisation des données qui seront exportées
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <CSVPreview addresses={addresses.slice(0, 5)} />
              {addresses.length > 5 && (
                <div className="text-center text-sm text-gray-500 mt-3">
                  ... et {addresses.length - 5} ligne{addresses.length - 5 > 1 ? 's' : ''}{' '}
                  supplémentaire{addresses.length - 5 > 1 ? 's' : ''} ({addresses.length} adresses
                  au total)
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}

interface PrintPreviewSheetProps {
  addresses: Address[]
  format: PrintFormat
}

const PrintPreviewSheet = React.memo<PrintPreviewSheetProps>(function PrintPreviewSheet({
  addresses,
  format,
}) {
  // Calcul dimensions A4 mémorisé
  const dimensions = useMemo(
    () => ({
      height: PREVIEW_DIMENSIONS.A4_SHEET.height,
      width: PREVIEW_DIMENSIONS.A4_SHEET.height * PREVIEW_DIMENSIONS.A4_SHEET.ratio,
    }),
    []
  )

  // Calculer le nombre de pages nécessaires selon le format
  const { addressesPerPage, totalPages, pagesToShow } = useMemo(() => {
    let perPage: number
    switch (format) {
      case 'A4_LABELS_10':
        perPage = 10
        break
      case 'A4_LABELS_14':
        perPage = 14
        break
      case 'A4_LABELS_16':
        perPage = 16
        break
      case 'A4_LABELS_21':
        perPage = 21
        break
      case 'A4_COMPACT':
        perPage = 20
        break // 2 colonnes de 10
      default:
        perPage = 15
        break
    }
    const total = Math.ceil(addresses.length / perPage)
    const show = Math.min(PREVIEW_MAX_PAGES, total)
    return { addressesPerPage: perPage, totalPages: total, pagesToShow: show }
  }, [addresses.length, format])

  // Formats rouleau : affichage spécial
  if (format === 'ROLL_57x32') {
    return <PrintPreviewRoll addresses={addresses} />
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: pagesToShow }, (_, pageIndex) => {
        const startIndex = pageIndex * addressesPerPage
        const pageAddresses = addresses.slice(startIndex, startIndex + addressesPerPage)

        return (
          <div
            key={pageIndex}
            className="bg-white shadow-lg border border-gray-300 relative overflow-hidden"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
          >
            {/* Marges visuelles */}
            <div
              className="absolute inset-0 border border-dashed border-gray-200"
              style={{ margin: '16px' }}
            />

            {/* Contenu de la page */}
            <div
              className="absolute inset-0 p-6 overflow-hidden"
              style={{ fontSize: '8px', lineHeight: '1.3' }}
            >
              {format === 'A4_LABELS_10' ? (
                <PrintPreviewLabels addresses={pageAddresses} gridCols={2} />
              ) : format === 'A4_LABELS_14' ? (
                <PrintPreviewLabels addresses={pageAddresses} gridCols={2} gridRows={7} />
              ) : format === 'A4_LABELS_16' ? (
                <PrintPreviewLabels addresses={pageAddresses} gridCols={2} gridRows={8} />
              ) : format === 'A4_LABELS_21' ? (
                <PrintPreviewLabels addresses={pageAddresses} gridCols={3} />
              ) : format === 'A4_COMPACT' ? (
                <PrintPreviewCompact addresses={pageAddresses} />
              ) : (
                <PrintPreviewList addresses={pageAddresses} />
              )}
            </div>

            {/* Numéro de page */}
            <div className="absolute bottom-2 right-4 text-xs text-gray-400">
              Page {pageIndex + 1}
            </div>
          </div>
        )
      })}

      {totalPages > pagesToShow && (
        <div className="text-center text-sm text-gray-500 py-2">
          ... et {totalPages - pagesToShow} page{totalPages - pagesToShow > 1 ? 's' : ''}{' '}
          supplémentaire{totalPages - pagesToShow > 1 ? 's' : ''} ({addresses.length} adresses au
          total)
        </div>
      )}
    </div>
  )
})

const PrintPreviewLabels = React.memo<{
  addresses: Address[]
  gridCols: number
  gridRows?: number
}>(function PrintPreviewLabels({ addresses, gridCols, gridRows }) {
  const totalLabels = gridRows ? gridCols * gridRows : gridCols === 2 ? 10 : 21
  const labelHeight =
    gridRows === 8 ? '12.5%' : gridRows === 7 ? '14.3%' : gridCols === 2 ? '19%' : '13%'

  return (
    <div
      className={`grid gap-2 h-full`}
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
    >
      {Array.from({ length: totalLabels }, (_, index) => {
        const address = addresses[index]
        return (
          <div
            key={index}
            className="border border-gray-400 rounded-sm bg-white flex flex-col justify-center items-center overflow-hidden"
            style={{
              height: labelHeight,
              minHeight:
                gridRows === 8
                  ? '55px'
                  : gridRows === 7
                    ? '60px'
                    : gridCols === 2
                      ? '80px'
                      : '55px',
              padding:
                gridRows === 8 ? '4px' : gridRows === 7 ? '5px' : gridCols === 2 ? '6px' : '4px',
              fontSize:
                gridRows === 8 ? '6px' : gridRows === 7 ? '6.5px' : gridCols === 2 ? '7px' : '6px',
              lineHeight: '1.2',
              textAlign: 'center',
            }}
          >
            {address ? (
              <div className="w-full text-center overflow-hidden">
                <div className="font-bold text-black truncate mb-1">
                  {address.firstName} {address.lastName}
                </div>
                <div className="text-gray-700 truncate mb-1">{address.addressLine1}</div>
                {address.addressLine2 && (
                  <div className="text-gray-700 truncate mb-1">{address.addressLine2}</div>
                )}
                <div className="text-gray-700 truncate mb-1">
                  {address.postalCode} {address.city}
                </div>
                <div className="font-semibold text-gray-800 truncate">{address.country}</div>
              </div>
            ) : (
              <div className="text-gray-300 text-center text-xs">Étiquette vide</div>
            )}
          </div>
        )
      })}
    </div>
  )
})

const PrintPreviewList = React.memo<{ addresses: Address[] }>(function PrintPreviewList({
  addresses,
}) {
  return (
    <div className="space-y-2 h-full overflow-hidden">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="border-b border-gray-300 pb-2"
          style={{ fontSize: '8px', lineHeight: '1.2' }}
        >
          <div className="space-y-0.5">
            <div className="font-semibold text-black">
              {address.firstName} {address.lastName}
            </div>
            <div className="text-gray-700">{address.addressLine1}</div>
            {address.addressLine2 && <div className="text-gray-700">{address.addressLine2}</div>}
            <div className="text-gray-700">
              {address.postalCode} {address.city}
            </div>
            <div className="font-medium text-gray-800">{address.country}</div>
          </div>
        </div>
      ))}
    </div>
  )
})

// Composant pour le format compact (2 colonnes)
const PrintPreviewCompact = React.memo<{ addresses: Address[] }>(function PrintPreviewCompact({
  addresses,
}) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="border border-gray-300 rounded-sm p-2 bg-gray-50"
          style={{ fontSize: '7px', lineHeight: '1.2' }}
        >
          <div className="space-y-0.5">
            <div className="font-semibold text-black">
              {address.firstName} {address.lastName}
            </div>
            <div className="text-gray-700">{address.addressLine1}</div>
            {address.addressLine2 && <div className="text-gray-700">{address.addressLine2}</div>}
            <div className="text-gray-700">
              {address.postalCode} {address.city}
            </div>
            <div className="font-medium text-gray-800">{address.country}</div>
          </div>
        </div>
      ))}
    </div>
  )
})

const PrintPreviewRoll = React.memo<{ addresses: Address[] }>(function PrintPreviewRoll({
  addresses,
}) {
  // Dimensions rouleau 57x32mm
  const rollHeight = PREVIEW_DIMENSIONS.ROLL_LABEL.height
  const rollWidth = rollHeight * PREVIEW_DIMENSIONS.ROLL_LABEL.ratio

  const maxLabelsToShow = Math.min(PREVIEW_MAX_LABELS_ROLL, addresses.length)

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 text-center mb-4">
        Aperçu du rouleau d&apos;étiquettes 57×32mm (une étiquette par adresse)
      </div>

      <div className="flex flex-col items-center space-y-2 bg-gray-50 p-4 rounded-lg">
        {Array.from({ length: maxLabelsToShow }, (_, index) => {
          const address = addresses[index]

          return (
            <div
              key={index}
              className="bg-white shadow-md border border-gray-400 rounded-sm relative overflow-hidden"
              style={{
                width: `${rollWidth}px`,
                height: `${rollHeight}px`,
              }}
            >
              {/* Marges visuelles */}
              <div
                className="absolute inset-0 border border-dashed border-gray-200"
                style={{ margin: '4px' }}
              />

              {/* Contenu de l'étiquette */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2">
                {address ? (
                  <div
                    className="w-full text-center overflow-hidden"
                    style={{
                      fontSize: '9px',
                      lineHeight: '1.1',
                    }}
                  >
                    <div className="font-bold text-black truncate mb-1">
                      {address.firstName} {address.lastName}
                    </div>
                    <div className="text-gray-700 truncate mb-1">{address.addressLine1}</div>
                    {address.addressLine2 && (
                      <div className="text-gray-700 truncate mb-1">{address.addressLine2}</div>
                    )}
                    <div className="text-gray-700 truncate mb-1">
                      {address.postalCode} {address.city}
                    </div>
                    <div className="font-semibold text-gray-800 truncate">{address.country}</div>
                  </div>
                ) : (
                  <div className="text-gray-300 text-center text-xs">Étiquette vide</div>
                )}
              </div>

              {/* Numéro d'étiquette */}
              <div className="absolute top-1 right-1 text-xs text-gray-400 bg-white px-1 rounded">
                {index + 1}
              </div>
            </div>
          )
        })}

        {addresses.length > maxLabelsToShow && (
          <div className="text-center text-sm text-gray-500 py-2 flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span>
              ... et {addresses.length - maxLabelsToShow} étiquette
              {addresses.length - maxLabelsToShow > 1 ? 's' : ''} supplémentaire
              {addresses.length - maxLabelsToShow > 1 ? 's' : ''}
              <br />({addresses.length} étiquettes au total)
            </span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>
        )}
      </div>
    </div>
  )
})

// Composant pour l'aperçu CSV
// Composant FormatCard optimisé
interface FormatCardProps {
  format: PrintFormat
  isSelected: boolean
  onSelect: (format: PrintFormat) => void
}

const FormatCard = React.memo<FormatCardProps>(function FormatCard({
  format,
  isSelected,
  onSelect,
}) {
  const { cardStyles, iconStyles, titleStyles, descriptionStyles } = getFormatCardStyles(isSelected)

  return (
    <label className={cardStyles} htmlFor={`format-${format}`}>
      <input
        type="radio"
        id={`format-${format}`}
        name="printFormat"
        value={format}
        checked={isSelected}
        onChange={() => onSelect(format)}
        className="sr-only"
        aria-describedby={`format-${format}-description`}
      />
      <div className="flex items-start gap-3">
        <div className={iconStyles}>{getFormatIcon(format)}</div>
        <div className="flex-1 min-w-0">
          <div className={titleStyles}>{PRINT_FORMAT_LABELS[format]}</div>
          <div id={`format-${format}-description`} className={descriptionStyles}>
            {getFormatDescription(format)}
          </div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2" aria-hidden="true">
          <i className="pi pi-check text-blue-500 text-sm"></i>
        </div>
      )}
    </label>
  )
})

const CSVPreview = React.memo<{ addresses: Address[] }>(function CSVPreview({ addresses }) {
  const headers = ['Prénom', 'Nom', 'Adresse 1', 'Adresse 2', 'Code Postal', 'Ville', 'Pays']

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="bg-gray-200">
            {headers.map((header, index) => (
              <th key={index} className="px-2 py-1 text-left border border-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addresses.map((address, index) => (
            <tr key={address.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-1 border border-gray-300">{address.firstName}</td>
              <td className="px-2 py-1 border border-gray-300">{address.lastName}</td>
              <td className="px-2 py-1 border border-gray-300">{address.addressLine1}</td>
              <td className="px-2 py-1 border border-gray-300">{address.addressLine2 || ''}</td>
              <td className="px-2 py-1 border border-gray-300">{address.postalCode}</td>
              <td className="px-2 py-1 border border-gray-300">{address.city}</td>
              <td className="px-2 py-1 border border-gray-300">{address.country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

function getFormatDescription(format: PrintFormat): string {
  switch (format) {
    case 'A4':
      return 'Une adresse par ligne, format classique'
    case 'A4_LABELS_10':
      return '10 étiquettes de 105×57mm par page'
    case 'ROLL_57x32':
      return 'Une étiquette 57×32mm par adresse'
    case 'A4_LABELS_14':
      return '14 étiquettes Avery 99.1×38.1mm par page (format L7163)'
    case 'A4_LABELS_16':
      return '16 étiquettes Avery 99.1×33.9mm par page (format L7162)'
    case 'A4_LABELS_21':
      return '21 étiquettes Avery 70×42.3mm par page (format L7160)'
    case 'A4_COMPACT':
      return 'Format compact 2 colonnes, économise le papier'
    case 'CSV_EXPORT':
      return 'Export des données au format CSV pour tableur'
    default:
      return ''
  }
}

function getFormatIcon(format: PrintFormat): string {
  switch (format) {
    case 'A4':
      return '📄'
    case 'A4_LABELS_10':
      return '🏷️'
    case 'ROLL_57x32':
      return '🎞️'
    case 'A4_LABELS_14':
      return '🏛️'
    case 'A4_LABELS_16':
      return '🗂️'
    case 'A4_LABELS_21':
      return '📇'
    case 'A4_COMPACT':
      return '📋'
    case 'CSV_EXPORT':
      return '📊'
    default:
      return '📄'
  }
}

function getOrderedFormats(): PrintFormat[] {
  return [
    'A4', // Formats A4 groupés
    'A4_COMPACT',
    'A4_LABELS_10',
    'A4_LABELS_14',
    'A4_LABELS_16',
    'A4_LABELS_21',
    'ROLL_57x32', // Formats rouleau
    'CSV_EXPORT', // Export
  ]
}

function getFormatCardStyles(isSelected: boolean) {
  const baseCardStyles =
    'relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
  const selectedCardStyles = 'border-blue-500 bg-blue-50'
  const unselectedCardStyles = 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'

  const baseIconStyles =
    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg'
  const selectedIconStyles = 'bg-blue-500 text-white'
  const unselectedIconStyles = 'bg-gray-100 text-gray-600'

  const baseTitleStyles = 'font-medium text-sm mb-1 leading-tight'
  const selectedTitleStyles = 'text-blue-900'
  const unselectedTitleStyles = 'text-gray-900'

  const baseDescriptionStyles = 'text-xs leading-relaxed'
  const selectedDescriptionStyles = 'text-blue-700'
  const unselectedDescriptionStyles = 'text-gray-600'

  return {
    cardStyles: `${baseCardStyles} ${isSelected ? selectedCardStyles : unselectedCardStyles}`,
    iconStyles: `${baseIconStyles} ${isSelected ? selectedIconStyles : unselectedIconStyles}`,
    titleStyles: `${baseTitleStyles} ${isSelected ? selectedTitleStyles : unselectedTitleStyles}`,
    descriptionStyles: `${baseDescriptionStyles} ${isSelected ? selectedDescriptionStyles : unselectedDescriptionStyles}`,
  }
}
