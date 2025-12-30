'use client'

import { Eye, Settings } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Panel } from 'primereact/panel'
import { ProgressBar } from 'primereact/progressbar'
import { Skeleton } from 'primereact/skeleton'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Lazy loading des modals pour améliorer FCP
const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(mod => ({ default: mod.AuthModal })), {
  loading: () => <Skeleton width="100%" height="400px" />,
  ssr: false,
})

const UpgradeModal = dynamic(() => import('@/components/UpgradeModal').then(mod => ({ default: mod.UpgradeModal })), {
  loading: () => <Skeleton width="100%" height="300px" />,
  ssr: false,
})
import { PREVIEW_DIMENSIONS, PREVIEW_MAX_LABELS_ROLL, PREVIEW_MAX_PAGES } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { usePrintLimit } from '@/hooks/usePrintLimit'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PRINT_CONFIGS, getEnabledFormats } from '@/lib/print/config'
import { downloadCSV, generateDebugPrintCSS, getPrintCSS } from '@/lib/print-formats'
import { printAddresses } from '@/lib/print-utils'
import { STORAGE_KEYS, useCollapsiblePanel, usePersistedSelection } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Address, PrintFormat } from '@/types/address'

// Formats disponibles pour les utilisateurs gratuits
const FREE_FORMATS: PrintFormat[] = ['A4_LABELS_10', 'CSV_EXPORT']

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

// Composant de la modale d'attente avec publicité premium
interface WaitingModalProps {
  visible: boolean
  progress: number
  onUpgrade: () => void
  t: (key: string) => string
}

const WaitingModal = React.memo<WaitingModalProps>(function WaitingModal({
  visible,
  progress,
  onUpgrade,
  t,
}) {
  return (
    <Dialog
      visible={visible}
      onHide={() => {}}
      modal
      closable={false}
      dismissableMask={false}
      className="w-11/12 md:w-[500px]"
      header={null}
    >
      <div className="text-center py-6">
        {/* Icône de chargement */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-spin pi-spinner text-blue-600 text-3xl"></i>
          </div>
        </div>

        {/* Message de chargement */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('print.waiting.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t('print.waiting.message')}
        </p>

        {/* Barre de progression */}
        <ProgressBar
          value={progress}
          showValue={false}
          className="mb-6"
          style={{ height: '8px' }}
        />

        {/* Publicité Premium */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-center mb-3">
            <i className="pi pi-bolt text-yellow-500 text-2xl mr-2"></i>
            <h4 className="text-md font-semibold text-gray-900">
              {t('print.waiting.premiumTitle')}
            </h4>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            {t('print.waiting.premiumMessage')}
          </p>
          <Button
            label={t('print.waiting.upgradeButton')}
            icon="pi pi-star"
            onClick={onUpgrade}
            className="w-full"
            severity="info"
          />
        </div>
      </div>
    </Dialog>
  )
})

export function PrintPreview({ addresses, className, t }: PrintPreviewProps) {
  // États d'authentification et limite d'impression
  const { user, userPlan, loading } = useAuth()
  const { canPrintAll, getMaxPrintable, freePrintLimit } = usePrintLimit()
  const { trackLabelGenerated } = useAnalytics()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showWaitingModal, setShowWaitingModal] = useState(false)
  const [waitingProgress, setWaitingProgress] = useState(0)
  const [pendingPrintAction, setPendingPrintAction] = useState<(() => void) | null>(null)

  // Navigation et routing
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'

  // Debug mode basé sur l'URL
  const searchParams = useSearchParams()
  const debugMode = searchParams.get('debug') === 'true'

  // Refs pour éviter les appels multiples
  const hasExecutedPendingActionRef = useRef(false)
  const printInProgressRef = useRef(false)
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    return getEnabledFormats().includes(value as PrintFormat)
  }, [])

  // États avec hooks personnalisés
  const selectedFormat = usePersistedSelection(
    STORAGE_KEYS.SELECTED_FORMAT,
    'A4_LABELS_10' as PrintFormat,
    isValidFormat
  )
  const printPanel = useCollapsiblePanel(STORAGE_KEYS.PRINT_PANEL_COLLAPSED, false)

  // État pour le décalage des étiquettes (planches partiellement utilisées)
  const [labelOffset, setLabelOffset] = useState(0)

  // Vérifier si le format sélectionné nécessite Premium
  const isPremiumFormat = useMemo(() => {
    return userPlan === 'free' && !FREE_FORMATS.includes(selectedFormat.value)
  }, [userPlan, selectedFormat.value])

  // Fonction pour exécuter l'impression réelle (appelée directement ou après timer)
  const executeActualPrint = useCallback(
    async (addressesToPrint: Address[] = addresses) => {
      try {
        if (selectedFormat.value === 'CSV_EXPORT') {
          downloadCSV(addressesToPrint, 'lalabel.csv')
          return
        }

        const printCSS = debugMode
          ? generateDebugPrintCSS(selectedFormat.value)
          : getPrintCSS(selectedFormat.value)

        // Configurer le reset du flag d'impression
        resetPrintFlag()

        // L'offset est une fonctionnalité premium uniquement
        const effectiveOffset = userPlan === 'premium' ? labelOffset : 0
        printAddresses(addressesToPrint, selectedFormat.value, printCSS, effectiveOffset)

        // Track analytics business
        if (user) {
          trackLabelGenerated({
            format: selectedFormat.value,
            count: addressesToPrint.length,
            userPlan: userPlan || 'free',
          })
        }
      } catch (error) {
        // En cas d'erreur, reset le flag immédiatement
        printInProgressRef.current = false
        throw error
      }
    },
    [addresses, selectedFormat.value, user, resetPrintFlag, debugMode, trackLabelGenerated, userPlan, labelOffset]
  )

  const executePrint = useCallback(
    async (addressesToPrint: Address[] = addresses) => {
      // Protection contre les appels multiples
      if (printInProgressRef.current) {
        return
      }
      printInProgressRef.current = true

      // Si utilisateur premium, impression instantanée
      if (userPlan === 'premium') {
        await executeActualPrint(addressesToPrint)
        return
      }

      // Si utilisateur gratuit, afficher la modale d'attente avec timer
      setShowWaitingModal(true)
      setWaitingProgress(0)

      // Nettoyer le timer précédent si existant
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current)
      }

      // Timer de 10 secondes avec progression
      const startTime = Date.now()
      const duration = 10000 // 10 secondes

      waitingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration) * 100, 100)
        setWaitingProgress(progress)

        if (progress >= 100) {
          if (waitingTimerRef.current) {
            clearInterval(waitingTimerRef.current)
            waitingTimerRef.current = null
          }
          setShowWaitingModal(false)
          executeActualPrint(addressesToPrint)
        }
      }, 100)
    },
    [addresses, userPlan, executeActualPrint]
  )

  // Nettoyer le timer au démontage du composant
  useEffect(() => {
    return () => {
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current)
      }
    }
  }, [])

  const handlePrint = useCallback(() => {
    // Vérifier si le format nécessite Premium
    if (isPremiumFormat) {
      // Rediriger vers la page pricing
      router.push(`/${locale}/pricing`)
      return
    }

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
    if (!canPrintAll(addresses.length)) {
      // L'utilisateur dépasse ses limites, ouvrir la modal d'upgrade
      setShowUpgradeModal(true)
      return
    }

    // Utilisateur connecté et dans les limites, exécuter directement l'impression
    executePrint()
  }, [isPremiumFormat, router, locale, user, addresses, canPrintAll, executePrint])

  const handlePrintLimited = useCallback(() => {
    // Imprimer seulement le nombre d'adresses autorisées
    const maxPrintable = getMaxPrintable(addresses.length)
    const limitedAddresses = addresses.slice(0, maxPrintable)
    executePrint(limitedAddresses)
  }, [addresses, getMaxPrintable, executePrint])

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
    if (!loading && user && pendingPrintAction && !hasExecutedPendingActionRef.current) {
      hasExecutedPendingActionRef.current = true

      // Vérifier les limites freemium et exécuter l'action appropriée
      const action = canPrintAll(addresses.length)
        ? pendingPrintAction
        : () => setShowUpgradeModal(true)

      action()
      setPendingPrintAction(null)
    }
  }, [loading, user, userPlan, pendingPrintAction, canPrintAll, addresses.length])

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
              {getEnabledFormats().map((format) => (
                <FormatCard
                  key={format}
                  format={format}
                  isSelected={selectedFormat.value === format}
                  onSelect={selectedFormat.updateValue}
                  isPremium={userPlan === 'free' && !FREE_FORMATS.includes(format)}
                  t={t}
                />
              ))}
            </div>
          </fieldset>

          {/* Message incitatif anti-gaspillage pour utilisateurs gratuits */}
          {PRINT_CONFIGS[selectedFormat.value]?.layout.type === 'grid' && userPlan === 'free' && (
            <div className="mt-4 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <i className="pi pi-lightbulb text-green-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {t('print.antiWaste.title')}
                  </div>
                  <div className="text-xs text-gray-700 mb-2">
                    {t('print.antiWaste.description')}
                  </div>
                  <Button
                    label={t('print.antiWaste.learnMore')}
                    size="small"
                    outlined
                    className="text-xs px-3 py-1 border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => router.push(`/${locale}/pricing`)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sélecteur d'offset pour planches partiellement utilisées - Premium uniquement */}
          {PRINT_CONFIGS[selectedFormat.value]?.layout.type === 'grid' && userPlan === 'premium' && (
            <LabelOffsetSelector
              format={selectedFormat.value}
              offset={labelOffset}
              onOffsetChange={setLabelOffset}
              t={t}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center mt-6 mb-4">
          <Button
            onClick={handlePrint}
            label={
              isPremiumFormat
                ? t('print.buttons.upgradeToPremiumFormat').replace(
                    '{format}',
                    t(`formats.${selectedFormat.value}.label`)
                  )
                : selectedFormat.value === 'CSV_EXPORT'
                  ? t('print.buttons.download')
                  : t('print.buttons.print')
            }
            icon={
              isPremiumFormat
                ? 'pi pi-star'
                : selectedFormat.value === 'CSV_EXPORT'
                  ? 'pi pi-download'
                  : 'pi pi-print'
            }
            size="small"
            className={isPremiumFormat ? 'px-6 bg-blue-600 hover:bg-blue-700' : 'px-6'}
            severity={isPremiumFormat ? 'info' : undefined}
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
              <PrintPreviewSheet
                addresses={addresses}
                format={selectedFormat.value}
                offset={userPlan === 'premium' ? labelOffset : 0}
                t={t}
              />
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
        printLimit={freePrintLimit}
      />

      {/* Modal d'attente avec publicité premium */}
      <WaitingModal
        visible={showWaitingModal}
        progress={waitingProgress}
        onUpgrade={() => router.push(`/${locale}/pricing`)}
        t={t}
      />
    </div>
  )
}

interface PrintPreviewSheetProps {
  addresses: Address[]
  format: PrintFormat
  offset?: number
  t: (key: string) => string
}

const PrintPreviewSheet = React.memo<PrintPreviewSheetProps>(function PrintPreviewSheet({
  addresses,
  format,
  offset = 0,
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
        // L'offset ne s'applique que sur la première page
        const isFirstPage = pageIndex === 0
        const pageOffset = isFirstPage ? offset : 0

        // Calculer les indices en tenant compte de l'offset sur la première page
        let startIndex: number
        let pageAddresses: Address[]

        if (isFirstPage) {
          // Première page : on prend moins d'adresses car il y a des cases vides
          startIndex = 0
          pageAddresses = addresses.slice(0, Math.max(0, addressesPerPage - offset))
        } else {
          // Pages suivantes : calculer l'index en tenant compte de l'offset initial
          startIndex = (pageIndex * addressesPerPage) - offset
          pageAddresses = addresses.slice(startIndex, startIndex + addressesPerPage)
        }

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
                    padding: paddingStyle,
                  }}
                >
                  {format === 'A4_LABELS_10' ? (
                    <PrintPreviewLabels
                      addresses={pageAddresses}
                      gridCols={2}
                      gridRows={5}
                      offset={pageOffset}
                      t={t}
                      format={format}
                    />
                  ) : format === 'A4_LABELS_14' ? (
                    <PrintPreviewLabels
                      addresses={pageAddresses}
                      gridCols={2}
                      gridRows={7}
                      offset={pageOffset}
                      t={t}
                      format={format}
                    />
                  ) : format === 'A4_LABELS_16' ? (
                    <PrintPreviewLabels
                      addresses={pageAddresses}
                      gridCols={2}
                      gridRows={8}
                      offset={pageOffset}
                      t={t}
                      format={format}
                    />
                  ) : format === 'A4_LABELS_21' ? (
                    <PrintPreviewLabels
                      addresses={pageAddresses}
                      gridCols={3}
                      gridRows={7}
                      offset={pageOffset}
                      t={t}
                      format={format}
                    />
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
  offset?: number
  t: (key: string) => string
  format?: PrintFormat
}>(function PrintPreviewLabels({ addresses, gridCols, gridRows, offset = 0, t, format }) {
  const totalLabels = gridRows ? gridCols * gridRows : gridCols === 2 ? 10 : 21

  // Créer un tableau avec les cases vides au début + les adresses
  const items = useMemo(() => {
    const emptyLabels = Array(offset).fill(null)
    return [...emptyLabels, ...addresses]
  }, [offset, addresses])

  // Obtenir les dimensions réelles de la configuration
  const config = format ? PRINT_CONFIGS[format] : null
  const dimensions = config?.styling.dimensions

  // Calculer les styles de grille basés sur les vraies proportions
  const gridStyle: React.CSSProperties =
    dimensions && gridRows
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: 0,
          width: '100%',
          height: '100%',
        }
      : {
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 0,
          width: '100%',
          height: '100%',
        }

  return (
    <div className="w-full h-full" style={gridStyle}>
      {Array.from({ length: totalLabels }, (_, index) => {
        const item = items[index]
        const isEmptyOffset = index < offset
        const labelStyle: React.CSSProperties = {
          width: '100%',
          height: '100%',
          padding: '4px',
          fontSize:
            gridRows === 8 ? '6px' : gridRows === 7 ? '6.5px' : gridCols === 2 ? '7px' : '6px',
          lineHeight: '1.2',
          textAlign: 'center',
          boxSizing: 'border-box',
          minHeight:
            gridRows === 8 ? '40px' : gridRows === 7 ? '45px' : gridCols === 2 ? '60px' : '50px',
        }

        return (
          <div
            key={index}
            className={`border rounded-sm flex flex-col justify-center items-center overflow-hidden ${
              isEmptyOffset
                ? 'border-dashed border-gray-300 bg-gray-50'
                : 'border-gray-400 bg-white'
            }`}
            style={labelStyle}
          >
            {item ? (
              <div className="w-full text-center overflow-hidden">
                <div className="font-bold text-black truncate mb-1">
                  {item.firstName} {item.lastName}
                </div>
                <div className="text-gray-700 truncate mb-1">{item.addressLine1}</div>
                {item.addressLine2 && (
                  <div className="text-gray-700 truncate mb-1">{item.addressLine2}</div>
                )}
                <div className="text-gray-700 truncate mb-1">
                  {item.postalCode} {item.city}
                </div>
                <div className="font-semibold text-gray-800 truncate">{item.country}</div>
              </div>
            ) : (
              <div className="text-gray-400 text-center" style={{ fontSize: '7px' }}>
                {isEmptyOffset ? '✕' : t('print.preview.emptyLabel')}
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
  isPremium?: boolean
  t: (key: string) => string
}

const FormatCard = React.memo<FormatCardProps>(function FormatCard({
  format,
  isSelected,
  onSelect,
  isPremium = false,
  t,
}) {
  const { cardStyles, iconStyles, titleStyles, descriptionStyles } = getFormatCardStyles(
    isSelected,
    isPremium
  )

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
          <div className={titleStyles}>
            {getFormatLabel(format, t)}
            {isPremium && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                <i className="pi pi-star text-xs mr-1"></i>
                Premium
              </span>
            )}
          </div>
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

// Fonction supprimée - utiliser getEnabledFormats() depuis @/lib/print/config

function getFormatCardStyles(isSelected: boolean, isPremium: boolean = false) {
  const baseCardStyles =
    'relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'

  let selectedCardStyles = 'border-blue-500 bg-blue-50'
  let unselectedCardStyles = 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'

  // Style subtil pour les formats premium
  if (isPremium) {
    unselectedCardStyles = 'border-blue-300 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50/50'
  }

  const baseIconStyles =
    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg'
  const selectedIconStyles = 'bg-blue-500 text-white'
  const unselectedIconStyles = 'bg-gray-100 text-gray-600'

  const baseTitleStyles = 'font-medium text-sm mb-1 leading-tight flex items-center flex-wrap'
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

// Composant pour gérer l'offset des étiquettes (planches partiellement utilisées)
interface LabelOffsetSelectorProps {
  format: PrintFormat
  offset: number
  onOffsetChange: (offset: number) => void
  t: (key: string) => string
}

const LabelOffsetSelector = React.memo<LabelOffsetSelectorProps>(function LabelOffsetSelector({
  format,
  offset,
  onOffsetChange,
  t,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = PRINT_CONFIGS[format]
  const maxLabels = config.layout.itemsPerPage || 21
  const columns = config.layout.columns || 3

  const handleIncrement = useCallback(() => {
    if (offset < maxLabels - 1) {
      onOffsetChange(offset + 1)
    }
  }, [offset, maxLabels, onOffsetChange])

  const handleDecrement = useCallback(() => {
    if (offset > 0) {
      onOffsetChange(offset - 1)
    }
  }, [offset, onOffsetChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value < maxLabels) {
      onOffsetChange(value)
    }
  }, [maxLabels, onOffsetChange])

  const handleCellClick = useCallback((index: number) => {
    // Cliquer sur une case = définir l'offset à cet index
    // Si on clique sur la case 5, ça veut dire que les 5 premières (0-4) sont utilisées
    // Donc offset = index
    onOffsetChange(index)
  }, [onOffsetChange])

  const handleReset = useCallback(() => {
    onOffsetChange(0)
  }, [onOffsetChange])

  // Génération de la grille de preview
  const gridCells = useMemo(() => {
    return Array.from({ length: maxLabels }, (_, index) => {
      const isUsed = index < offset
      const isNext = index === offset
      return { index, isUsed, isNext }
    })
  }, [maxLabels, offset])

  return (
    <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50/30">
      {/* Header cliquable pour expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <i className="pi pi-box text-blue-600"></i>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {t('print.offset.title')}
            </div>
            <div className="text-xs text-gray-600">
              {offset > 0
                ? t('print.offset.summary').replace('{count}', offset.toString())
                : t('print.offset.summaryNone')}
            </div>
          </div>
        </div>
        <i className={cn('pi text-gray-600 transition-transform', isExpanded ? 'pi-chevron-up' : 'pi-chevron-down')}></i>
      </button>

      {/* Contenu expandable */}
      {isExpanded && (
        <div className="p-4 pt-4 space-y-4 border-t border-blue-200">
          <div className="text-xs text-gray-600">
            {t('print.offset.description')}
          </div>

          {/* Input avec boutons +/- */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{t('print.offset.labelUsed')}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={offset === 0}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('print.offset.decrease')}
                >
                  <i className="pi pi-minus text-sm"></i>
                </button>
                <input
                  type="number"
                  value={offset}
                  onChange={handleInputChange}
                  min="0"
                  max={maxLabels - 1}
                  className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={offset >= maxLabels - 1}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('print.offset.increase')}
                >
                  <i className="pi pi-plus text-sm"></i>
                </button>
              </div>
              {offset > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  {t('print.offset.reset')}
                </button>
              )}
            </div>
          </div>

          {/* Preview de la grille cliquable */}
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <div className="text-xs text-gray-600 mb-2 text-center">
              {t('print.offset.clickInstruction')}
            </div>
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                maxWidth: `${columns * 40}px`,
              }}
            >
              {gridCells.map((cell) => (
                <button
                  key={cell.index}
                  type="button"
                  onClick={() => handleCellClick(cell.index)}
                  className={cn(
                    'aspect-square rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer',
                    'hover:scale-105 active:scale-95',
                    cell.isUsed && 'bg-gray-300 text-gray-600 hover:bg-gray-400',
                    cell.isNext && 'bg-green-500 text-white ring-2 ring-green-600 hover:bg-green-600',
                    !cell.isUsed && !cell.isNext && 'bg-white border border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'
                  )}
                  title={
                    cell.isUsed
                      ? t('print.offset.cellUsed')
                      : cell.isNext
                        ? t('print.offset.cellNext')
                        : t('print.offset.cellAvailable')
                  }
                  aria-label={`${t('print.offset.selectPosition')} ${cell.index + 1}`}
                >
                  {cell.isUsed ? '✓' : cell.isNext ? '→' : cell.index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-center text-gray-600">
              {offset > 0 ? (
                <span>
                  💡 {t('print.offset.startPosition').replace('{position}', (offset + 1).toString())}
                </span>
              ) : (
                <span>
                  ✨ {t('print.offset.newSheet')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
