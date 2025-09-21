'use client'

import { Eye, Settings } from 'lucide-react'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthModal } from '@/components/auth/AuthModal'
import { UpgradeModal } from '@/components/UpgradeModal'
import { PREVIEW_DIMENSIONS, PREVIEW_MAX_LABELS_ROLL, PREVIEW_MAX_PAGES } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useUsageTracking } from '@/hooks/useUsageTracking'
import { downloadCSV, getPrintCSS, generateDebugPrintCSS } from '@/lib/print-formats'
import { PRINT_CONFIGS } from '@/lib/print/config'
import { printAddresses } from '@/lib/print-utils'
import { STORAGE_KEYS, useCollapsiblePanel, usePersistedSelection } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Address, PrintFormat } from '@/types/address'

// Interface pour les composants qui n'utilisent que les adresses
interface PreviewAddressOnlyProps {
  addresses: Address[]
}

// Interface pour les composants qui utilisent les traductions
// Utilisée par: PrintPreviewRoll, CSVPreview
interface PreviewComponentProps {
  addresses: Address[]
  t: (key: string) => string
}

interface PrintPreviewProps {
  addresses: Address[]
  className?: string
  t: (key: string) => string
}

export function PrintPreview({ addresses, className, t }: PrintPreviewProps) {
  // États d'authentification et usage tracking
  const { user, userPlan, loading: authLoading } = useAuth()
  const {
    remainingLabels,
    canPrintLabels,
    getMaxPrintableLabels,
    trackLabelUsage,
    loading: usageLoading,
  } = useUsageTracking()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [pendingPrintAction, setPendingPrintAction] = useState<(() => void) | null>(null)

  // Debug mode basé sur l'URL
  const searchParams = useSearchParams()
  const debugMode = searchParams.get('debug') === 'true'

  // Refs pour éviter les appels multiples
  const hasExecutedPendingActionRef = useRef(false)
  const printInProgressRef = useRef(false)

  /**
   * Remet le flag d'impression à false après un délai sécurisé
   */
  const resetPrintFlag = useCallback(() => {
    // Combinaison afterprint + timeout pour plus de robustesse
    let hasReset = false

    const resetFlag = () => {
      if (!hasReset) {
        printInProgressRef.current = false
        hasReset = true
      }
    }

    // Reset par événement (si supporté)
    const handleAfterPrint = () => {
      resetFlag()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
    window.addEventListener('afterprint', handleAfterPrint)

    // Reset par timeout en fallback (plus court maintenant)
    const timeoutId = setTimeout(resetFlag, 1000)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

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

  const executePrint = useCallback(
    async (addressesToPrint: Address[] = addresses) => {
      // Protection contre les appels multiples
      if (printInProgressRef.current) {
        return
      }
      printInProgressRef.current = true

      try {
        if (selectedFormat.value === 'CSV_EXPORT') {
          downloadCSV(addressesToPrint, 'adresses-lablr.csv')
          if (user) {
            await trackLabelUsage(addressesToPrint.length)
          }
          return
        }

        const printCSS = debugMode
          ? generateDebugPrintCSS(selectedFormat.value)
          : getPrintCSS(selectedFormat.value)

        // Configurer le reset du flag d'impression
        resetPrintFlag()

        printAddresses(addressesToPrint, selectedFormat.value, printCSS)

        // Track l'usage après impression réussie
        if (user) {
          await trackLabelUsage(addressesToPrint.length)
        }
      } catch (error) {
        // En cas d'erreur, reset le flag immédiatement
        printInProgressRef.current = false
        throw error
      }
    },
    [addresses, selectedFormat.value, user, trackLabelUsage, resetPrintFlag, debugMode]
  )

  const handlePrint = useCallback(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      // Stocker l'action d'impression en attente avec les adresses actuelles
      hasExecutedPendingActionRef.current = false
      setPendingPrintAction(() => () => executePrint(addresses))
      // Ouvrir la modal d'authentification
      setShowAuthModal(true)
      return
    }

    // Vérifier les limites freemium
    if (!canPrintLabels(addresses.length)) {
      // L'utilisateur dépasse ses limites, ouvrir la modal d'upgrade
      setShowUpgradeModal(true)
      return
    }

    // Utilisateur connecté et dans les limites, exécuter directement l'impression
    executePrint()
  }, [user, addresses.length, canPrintLabels, executePrint])

  const handlePrintLimited = useCallback(() => {
    // Imprimer seulement le nombre d'adresses autorisées
    const maxPrintable = getMaxPrintableLabels(addresses.length)
    const limitedAddresses = addresses.slice(0, maxPrintable)
    executePrint(limitedAddresses)
  }, [addresses, getMaxPrintableLabels, executePrint])


  const handleAuthModalHide = useCallback(() => {
    setShowAuthModal(false)
    setPendingPrintAction(null)
    hasExecutedPendingActionRef.current = false
  }, [])

  /**
   * Callback vide - la logique d'authentification est maintenant dans useEffect
   */
  const handleAuthSuccess = useCallback(() => {
    // La logique est maintenant gérée directement dans useEffect
    // Ce callback existe juste pour satisfaire l'interface d'AuthModal
  }, [])

  // Réagir aux changements d'état auth pour traiter les actions pendantes
  useEffect(() => {
    if (!authLoading && user && pendingPrintAction && !hasExecutedPendingActionRef.current) {
      hasExecutedPendingActionRef.current = true

      // Vérifier les limites freemium et exécuter l'action appropriée
      const action = canPrintLabels(addresses.length)
        ? pendingPrintAction
        : () => setShowUpgradeModal(true)

      action()
      setPendingPrintAction(null)
    }
  }, [authLoading, user, userPlan, pendingPrintAction, canPrintLabels, addresses.length])

  if (addresses.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Panel
        header={
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-semibold text-gray-900">{t('print.title')}</span>
          </div>
        }
        className="w-full"
        toggleable
        collapsed={printPanel.isCollapsed}
        onToggle={printPanel.toggle}
      >
        <div className="mb-3 text-600 text-sm">
          {t('print.description').replace('{count}', addresses.length.toString())}
        </div>
        {/* Sélecteur de format */}
        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-900 mb-4">
              {t('print.formatTitle')}
            </legend>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label={t('print.formatAriaLabel')}
            >
              {getOrderedFormats().map((format) => (
                <FormatCard
                  key={format}
                  format={format}
                  isSelected={selectedFormat.value === format}
                  onSelect={selectedFormat.updateValue}
                  t={t}
                />
              ))}
            </div>
          </fieldset>
        </div>


        {/* Actions */}
        <div className="flex justify-center mt-6 mb-4">
          <Button
            onClick={handlePrint}
            label={
              selectedFormat.value === 'CSV_EXPORT'
                ? t('print.buttons.download')
                : t('print.buttons.print')
            }
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
              {t('print.preview.title').replace(
                '{format}',
                getFormatLabel(selectedFormat.value, t)
              )}
            </div>
            <div className="text-sm text-gray-600 mb-4">{t('print.preview.description')}</div>
            <div className="flex justify-center bg-gray-100 p-6 rounded-lg mb-4">
              <PrintPreviewSheet addresses={addresses} format={selectedFormat.value} t={t} />
            </div>
          </div>
        )}

        {/* Aperçu CSV intégré */}
        {selectedFormat.value === 'CSV_EXPORT' && (
          <div className="mt-2">
            <div className="text-sm font-semibold text-900 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('print.preview.csvTitle')}
            </div>
            <div className="text-sm text-gray-600 mb-4">{t('print.preview.csvDescription')}</div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <CSVPreview addresses={addresses.slice(0, 5)} t={t} />
              {addresses.length > 5 && (
                <div className="text-center text-sm text-gray-500 mt-3">
                  {t('print.preview.csvPagination')
                    .replace('{count}', (addresses.length - 5).toString())
                    .replace('{s}', addresses.length - 5 > 1 ? 's' : '')
                    .replace('{total}', addresses.length.toString())}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Modal d'authentification */}
      <AuthModal
        visible={showAuthModal}
        onHide={handleAuthModalHide}
        onSuccess={handleAuthSuccess}
        t={t}
      />

      {/* Modal d'upgrade freemium */}
      <UpgradeModal
        visible={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        onPrintLimited={handlePrintLimited}
        t={t}
        totalAddresses={addresses.length}
        remainingLabels={remainingLabels}
      />
    </div>
  )
}

interface PrintPreviewSheetProps {
  addresses: Address[]
  format: PrintFormat
  t: (key: string) => string
}

const PrintPreviewSheet = React.memo<PrintPreviewSheetProps>(function PrintPreviewSheet({
  addresses,
  format,
  t,
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
    return <PrintPreviewRoll addresses={addresses} t={t} />
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
            {(() => {
              const config = PRINT_CONFIGS[format]
              const spacing = config.styling.spacing
              const marginStyle = spacing
                ? `${spacing.marginTop} ${spacing.marginRight} ${spacing.marginBottom} ${spacing.marginLeft}`
                : '16px'

              return (
                <div
                  className="absolute inset-0 border border-dashed border-gray-200"
                  style={{ margin: marginStyle }}
                />
              )
            })()}

            {/* Contenu de la page */}
            {(() => {
              const config = PRINT_CONFIGS[format]
              const spacing = config.styling.spacing
              const paddingStyle = spacing
                ? `${spacing.marginTop} ${spacing.marginRight} ${spacing.marginBottom} ${spacing.marginLeft}`
                : '24px'

              return (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    fontSize: '8px',
                    lineHeight: '1.3',
                    padding: paddingStyle
                  }}
                >
                  {format === 'A4_LABELS_10' ? (
                    <PrintPreviewLabels addresses={pageAddresses} gridCols={2} gridRows={5} t={t} format={format} />
                  ) : format === 'A4_LABELS_14' ? (
                    <PrintPreviewLabels addresses={pageAddresses} gridCols={2} gridRows={7} t={t} format={format} />
                  ) : format === 'A4_LABELS_16' ? (
                    <PrintPreviewLabels addresses={pageAddresses} gridCols={2} gridRows={8} t={t} format={format} />
                  ) : format === 'A4_LABELS_21' ? (
                    <PrintPreviewLabels addresses={pageAddresses} gridCols={3} gridRows={7} t={t} format={format} />
                  ) : format === 'A4_COMPACT' ? (
                    <PrintPreviewCompact addresses={pageAddresses} />
                  ) : (
                    <PrintPreviewList addresses={pageAddresses} />
                  )}
                </div>
              )
            })()}

            {/* Numéro de page */}
            <div className="absolute bottom-2 right-4 text-xs text-gray-400">
              {t('status.pageNumber').replace('{number}', (pageIndex + 1).toString())}
            </div>
          </div>
        )
      })}

      {totalPages > pagesToShow && (
        <div className="text-center text-sm text-gray-500 py-2">
          {t('print.preview.pagination')
            .replace('{count}', (totalPages - pagesToShow).toString())
            .replace('{s}', totalPages - pagesToShow > 1 ? 's' : '')
            .replace('{total}', addresses.length.toString())}
        </div>
      )}
    </div>
  )
})

const PrintPreviewLabels = React.memo<{
  addresses: Address[]
  gridCols: number
  gridRows?: number
  t: (key: string) => string
  format?: PrintFormat
}>(function PrintPreviewLabels({ addresses, gridCols, gridRows, t, format }) {
  const totalLabels = gridRows ? gridCols * gridRows : gridCols === 2 ? 10 : 21

  // Obtenir les dimensions réelles de la configuration
  const config = format ? PRINT_CONFIGS[format] : null
  const dimensions = config?.styling.dimensions

  // Calculer les styles de grille basés sur les vraies proportions
  const gridStyle: React.CSSProperties = dimensions && gridRows ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
    gap: 0,
    width: '100%',
    height: '100%'
  } : {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
    gap: 0,
    width: '100%',
    height: '100%'
  }

  return (
    <div className="w-full h-full" style={gridStyle}>
      {Array.from({ length: totalLabels }, (_, index) => {
        const address = addresses[index]
        const labelStyle: React.CSSProperties = {
          width: '100%',
          height: '100%',
          padding: '4px',
          fontSize: gridRows === 8 ? '6px' : gridRows === 7 ? '6.5px' : gridCols === 2 ? '7px' : '6px',
          lineHeight: '1.2',
          textAlign: 'center',
          boxSizing: 'border-box',
          minHeight: gridRows === 8 ? '40px' : gridRows === 7 ? '45px' : gridCols === 2 ? '60px' : '50px'
        }

        return (
          <div
            key={index}
            className="border border-gray-400 rounded-sm bg-white flex flex-col justify-center items-center overflow-hidden"
            style={labelStyle}
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
              <div className="text-gray-300 text-center text-xs">
                {t('print.preview.emptyLabel')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

const PrintPreviewList = React.memo<PreviewAddressOnlyProps>(function PrintPreviewList({
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
const PrintPreviewCompact = React.memo<PreviewAddressOnlyProps>(function PrintPreviewCompact({
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

const PrintPreviewRoll = React.memo<PreviewComponentProps>(function PrintPreviewRoll({
  addresses,
  t,
}) {
  // Dimensions rouleau 57x32mm
  const rollHeight = PREVIEW_DIMENSIONS.ROLL_LABEL.height
  const rollWidth = rollHeight * PREVIEW_DIMENSIONS.ROLL_LABEL.ratio

  const maxLabelsToShow = Math.min(PREVIEW_MAX_LABELS_ROLL, addresses.length)

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 text-center mb-4">
        {t('print.preview.rollDescription')}
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
                  <div className="text-gray-300 text-center text-xs">
                    {t('print.preview.emptyLabel')}
                  </div>
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
              {t('print.preview.rollPagination')
                .replace('{count}', (addresses.length - maxLabelsToShow).toString())
                .replace('{s}', addresses.length - maxLabelsToShow > 1 ? 's' : '')}
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
  t: (key: string) => string
}

const FormatCard = React.memo<FormatCardProps>(function FormatCard({
  format,
  isSelected,
  onSelect,
  t,
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
          <div className={titleStyles}>{getFormatLabel(format, t)}</div>
          <div id={`format-${format}-description`} className={descriptionStyles}>
            {getFormatDescription(format, t)}
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

const CSVPreview = React.memo<PreviewComponentProps>(function CSVPreview({ addresses, t }) {
  const headers = [
    t('csv.headers.firstName'),
    t('csv.headers.lastName'),
    t('csv.headers.address1'),
    t('csv.headers.address2'),
    t('csv.headers.postalCode'),
    t('csv.headers.city'),
    t('csv.headers.country'),
  ]

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

function getFormatLabel(format: PrintFormat, t: (key: string) => string): string {
  switch (format) {
    case 'A4':
      return t('formats.A4.label')
    case 'A4_LABELS_10':
      return t('formats.A4_LABELS_10.label')
    case 'ROLL_57x32':
      return t('formats.ROLL_57x32.label')
    case 'A4_LABELS_14':
      return t('formats.A4_LABELS_14.label')
    case 'A4_LABELS_16':
      return t('formats.A4_LABELS_16.label')
    case 'A4_LABELS_21':
      return t('formats.A4_LABELS_21.label')
    case 'A4_COMPACT':
      return t('formats.A4_COMPACT.label')
    case 'CSV_EXPORT':
      return t('formats.CSV_EXPORT.label')
    default:
      return ''
  }
}

function getFormatDescription(format: PrintFormat, t: (key: string) => string): string {
  switch (format) {
    case 'A4':
      return t('formats.A4.description')
    case 'A4_LABELS_10':
      return t('formats.A4_LABELS_10.description')
    case 'ROLL_57x32':
      return t('formats.ROLL_57x32.description')
    case 'A4_LABELS_14':
      return t('formats.A4_LABELS_14.description')
    case 'A4_LABELS_16':
      return t('formats.A4_LABELS_16.description')
    case 'A4_LABELS_21':
      return t('formats.A4_LABELS_21.description')
    case 'A4_COMPACT':
      return t('formats.A4_COMPACT.description')
    case 'CSV_EXPORT':
      return t('formats.CSV_EXPORT.description')
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
