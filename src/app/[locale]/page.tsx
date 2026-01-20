'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Skeleton } from 'primereact/skeleton'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddressEditor } from '@/components/address-editor'
import { FAQ } from '@/components/FAQ'
import FeedbackSection from '@/components/FeedbackSection'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/components/file-upload'
import { Header } from '@/components/Header'
import { HeroSteps } from '@/components/HeroSteps'
import { HEADER_HEIGHT, SCROLL_DELAY } from '@/constants/ui'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'
import { cleanAddressData } from '@/lib/address-parser'
import { parseUniversalFile, type UniversalParseResult } from '@/lib/universal-parser'
import type { Address } from '@/types/address'

// ⚡ OPTIMISATION: Lazy loading des composants lourds pour améliorer FCP
// PrintPreview (1355 lignes) - Chargé uniquement quand des adresses sont affichées
const PrintPreview = dynamic(
  () => import('@/components/print-preview').then((mod) => ({ default: mod.PrintPreview })),
  {
    loading: () => (
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <Skeleton width="200px" height="40px" className="rounded" />
        <Skeleton width="100%" height="500px" className="rounded" />
        <Skeleton width="150px" height="48px" className="rounded" />
      </div>
    ),
    ssr: false,
  }
)

// AddressList (439 lignes) - Chargé uniquement quand des adresses existent
const AddressList = dynamic(
  () => import('@/components/address-list').then((mod) => ({ default: mod.AddressList })),
  {
    loading: () => (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4 mb-6">
          <Skeleton width="300px" height="40px" className="rounded" />
          <Skeleton width="100%" height="48px" className="rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width="100%" height="120px" className="rounded" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function Home() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)
  const { user, loading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [parseResult, setParseResult] = useState<UniversalParseResult | null>(null)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const printPreviewRef = useRef<HTMLDivElement>(null)
  const statsCardRef = useRef<HTMLDivElement>(null)
  const hasPrefetchedRef = useRef(false)

  // Utility function for smooth scrolling with header offset
  const scrollToElement = useCallback((element: HTMLElement, offset: number = 0) => {
    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: Math.max(0, elementPosition), // Prevent negative scroll
      behavior: 'smooth',
    })
  }, [])

  // Scroll to stats card after addresses are loaded from file import
  const scrollToStatsCard = useCallback(() => {
    const element = statsCardRef.current
    if (element) {
      scrollToElement(element, HEADER_HEIGHT)
    }
  }, [scrollToElement])

  const handleFileContent = useCallback(
    (content: string, filename: string) => {
      const result = parseUniversalFile(content)
      const cleanedAddresses = cleanAddressData(result.addresses)

      setAddresses(cleanedAddresses)
      setErrors(result.errors)
      setFileName(filename)
      setParseResult(result)
      setIsManualMode(false) // Retour au mode fichier lors d'un import
      setShowPrintPreview(true) // Auto-affichage en mode fichier

      // Déclencher l'auto-scroll seulement si utilisateur connecté
      // En mode non connecté, l'utilisateur a déjà scrollé pour accéder au FileUpload
      if (cleanedAddresses.length > 0 && user) {
        setShouldAutoScroll(true)
      }
    },
    [user]
  )

  // Auto-scroll to stats card only when triggered by file import
  useEffect(() => {
    if (shouldAutoScroll && addresses.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToStatsCard()
        setShouldAutoScroll(false) // Reset flag après le scroll
      }, SCROLL_DELAY)
      return () => clearTimeout(timeoutId)
    }
  }, [shouldAutoScroll, addresses.length, scrollToStatsCard])

  // ⚡ OPTIMISATION Phase 3: Prefetch intelligent des composants lourds
  // Prefetch PrintPreview et AddressList dès qu'on détecte une intention d'utilisation
  useEffect(() => {
    if (!hasPrefetchedRef.current && typeof window !== 'undefined') {
      // Prefetch après un court délai (utilisateur a le temps de lire le hero)
      const timeoutId = setTimeout(() => {
        // Prefetch silencieux des composants lourds
        import('@/components/print-preview').catch(() => {
          /* Ignore prefetch errors */
        })
        import('@/components/address-list').catch(() => {
          /* Ignore prefetch errors */
        })
        hasPrefetchedRef.current = true
      }, 2000) // 2s après le chargement initial

      return () => clearTimeout(timeoutId)
    }
  }, [])

  const handleEditAddress = useCallback((address: Address) => {
    setEditingAddress(address)
  }, [])

  const handleDeleteAddress = useCallback(
    (addressId: string) => {
      confirmDialog({
        message: t('confirm.deleteAddress.message'),
        header: t('confirm.deleteAddress.title'),
        icon: 'pi pi-exclamation-triangle',
        defaultFocus: 'reject',
        acceptClassName: 'p-button-danger',
        acceptLabel: t('confirm.deleteAddress.accept'),
        rejectLabel: t('confirm.deleteAddress.reject'),
        accept: () => {
          setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
        },
      })
    },
    [t]
  )

  const handleAddAddress = useCallback(() => {
    setIsAddingAddress(true)
  }, [])

  const handleSaveAddress = useCallback(
    (address: Address) => {
      if (editingAddress) {
        // Mise à jour d'une adresse existante
        setAddresses((prev) => prev.map((addr) => (addr.id === address.id ? address : addr)))
        setEditingAddress(null)
      } else {
        // Ajout d'une nouvelle adresse
        setAddresses((prev) => [...prev, address])
        setIsAddingAddress(false)
      }
    },
    [editingAddress]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingAddress(null)
    setIsAddingAddress(false)
  }, [])

  const handleManualCreation = useCallback(() => {
    setIsManualMode(true)
    setShowPrintPreview(false) // Pas d'auto-affichage en mode manuel
    // Pas de scroll automatique - l'utilisateur reste où il a cliqué
  }, [])

  const handleBackToFileUpload = useCallback(() => {
    setIsManualMode(false)
    setShowPrintPreview(false) // Reset lors du retour
    // Pas de scroll automatique - l'utilisateur peut rester où il est
  }, [])

  const handleResetAndImportNew = useCallback(() => {
    // Réinitialiser toutes les données
    setAddresses([])
    setErrors([])
    setFileName('')
    setParseResult(null)
    setIsManualMode(false)
    setShowPrintPreview(false)
    // Pas de scroll automatique - l'utilisateur peut rester où il est
  }, [])

  const handleGenerateLabels = useCallback(() => {
    setShowPrintPreview(true)
    // Scroll vers PrintPreview après un court délai
    setTimeout(() => {
      if (printPreviewRef.current) {
        scrollToElement(printPreviewRef.current, HEADER_HEIGHT)
      }
    }, 100)
  }, [scrollToElement])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header t={t} />

      {/* Main Content Area */}
      <main className="flex-1 relative -mt-16">
        {/* Section Hero avec background animé - min-h-screen uniquement pour non connectés */}
        <div className={`relative flex items-center ${!user && !loading ? 'min-h-screen' : ''}`}>
          {/* Background animé avec transition progressive */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>
            {/* Gradient fade progressif vers le bas - transition très douce */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 via-white/60 to-white"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative pt-16 w-full">
            {/* Hero Banner - Conditionnel selon connexion */}
            {loading ? (
              // Skeleton loader pendant le chargement
              <div className="py-12 text-center">
                <div className="max-w-4xl mx-auto animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
                  <HeroSteps t={t} variant="compact" />
                </div>
              </div>
            ) : user ? (
              // Hero pour utilisateurs connectés (gratuit + premium) - Version compacte
              <div className="py-12 text-center">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    <span className="text-gray-900">{t('header.welcome')} </span>
                    <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                      {t('header.welcomeBrand')}
                    </span>
                  </h2>
                  <p className="text-gray-600 text-lg mb-8">{t('header.description')}</p>

                  {/* Section processus 3 étapes - Version condensée */}
                  <HeroSteps t={t} variant="compact" />
                </div>
              </div>
            ) : (
              // Hero pour utilisateurs non connectés - Version marketing complète
              <div className="py-16 md:py-24 text-center">
                {/* Titre principal - Style bicolore */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-gray-900">{t('hero.title.part1')}</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {t('hero.title.part2')}
                  </span>
                </h1>

                {/* Sous-titre descriptif */}
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-10">
                  {t('hero.subtitle')}
                </p>

                {/* CTA - Bouton unique */}
                <div className="flex justify-center mb-16">
                  <button
                    type="button"
                    aria-label={t('hero.cta.primary')}
                    onClick={() => {
                      const fileUploadSection = document.getElementById('file-upload-section')
                      if (fileUploadSection) {
                        fileUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white px-8 py-4 rounded-lg text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <span>{t('hero.cta.primary')}</span>
                    <i className="pi pi-arrow-right text-sm" aria-hidden="true"></i>
                  </button>
                </div>

                {/* Section processus 3 étapes - Version full */}
                <div id="steps-section" className="max-w-4xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                    {t('steps.heading')}
                  </h2>
                  <HeroSteps t={t} variant="full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections - Background blanc solide */}
        <div className="relative bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-6 pb-12">
              {/* File Upload - Masqué si des adresses sont présentes */}
              {!isManualMode && addresses.length === 0 && (
                <div id="file-upload-section">
                  <FileUpload
                    onFileContent={handleFileContent}
                    onManualCreation={handleManualCreation}
                    t={t}
                  />
                </div>
              )}

              {/* Stats Card avec informations de détection */}
              {fileName && parseResult && (
                <div ref={statsCardRef} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          addresses.length > 0 ? 'bg-green-50' : 'bg-orange-50'
                        }`}
                      >
                        <i
                          className={`text-xl ${
                            addresses.length > 0
                              ? 'pi pi-check text-green-500'
                              : 'pi pi-exclamation-triangle text-orange-500'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('status.fileProcessed')}</p>
                        <p className="font-semibold text-gray-900">{fileName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-bold mb-1 ${
                          addresses.length > 0 ? 'text-blue-500' : 'text-orange-500'
                        }`}
                      >
                        {addresses.length}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addresses.length === 0
                          ? t('status.noAddressFound')
                          : addresses.length === 1
                            ? t('status.addressExtracted')
                            : t('status.addressesExtracted')}
                      </p>
                    </div>
                  </div>

                  {/* Bouton "Importer un autre fichier" */}
                  {addresses.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleResetAndImportNew}
                        aria-label={t('status.importNewFile')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <i className="pi pi-file-import" aria-hidden="true"></i>
                        <span>{t('status.importNewFile')}</span>
                      </button>
                    </div>
                  )}
                  {addresses.length === 0 && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="pi pi-info-circle text-orange-500 text-sm mt-0.5"></i>
                        <div className="text-sm text-orange-800 flex-1">
                          <p className="font-medium mb-1">{t('status.noAddressFound')}</p>
                          <p className="mb-3">{t('status.checkFileFormat')}</p>
                          <div className="space-y-2">
                            <p className="text-xs text-orange-700">
                              {t('fileAnalysis.helpImprove')}
                            </p>
                            <p className="text-xs text-orange-600 italic">
                              {t('fileAnalysis.privacy')}
                            </p>
                            <div className="flex justify-start">
                              <a
                                href={`mailto:contact@lalabel.app?subject=${encodeURIComponent(t('fileAnalysis.emailSubject'))}&body=${encodeURIComponent(t('fileAnalysis.emailBody'))}`}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-medium rounded-md transition-colors duration-200 border border-orange-300 hover:border-orange-400"
                              >
                                <i className="pi pi-send text-xs"></i>
                                {t('fileAnalysis.sendFile')}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {(addresses.length > 0 || errors.length > 0 || isManualMode) && (
                <>
                  {addresses.length > 0 && showPrintPreview && (
                    <div ref={printPreviewRef}>
                      <PrintPreview addresses={addresses} t={t} />
                    </div>
                  )}
                  <div id="addresses-section">
                    <AddressList
                      addresses={addresses}
                      errors={errors}
                      onEditAddress={handleEditAddress}
                      onDeleteAddress={handleDeleteAddress}
                      onAddAddress={handleAddAddress}
                      onImportFile={handleBackToFileUpload}
                      onGenerateLabels={handleGenerateLabels}
                      isManualMode={isManualMode}
                      showGenerateButton={isManualMode && addresses.length > 0 && !showPrintPreview}
                      t={t}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <FAQ t={t} locale={locale} />

      {/* Feedback Section */}
      <FeedbackSection t={t} />

      {/* Footer */}
      <Footer t={t} />

      {/* Address Editor Modal */}
      <AddressEditor
        address={editingAddress || undefined}
        isOpen={!!editingAddress || isAddingAddress}
        onSave={handleSaveAddress}
        onCancel={handleCancelEdit}
        title={editingAddress ? t('editor.title.edit') : t('editor.title.add')}
        t={t}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
