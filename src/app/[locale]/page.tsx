'use client'

import { useParams } from 'next/navigation'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddressEditor } from '@/components/address-editor'
import { AddressList } from '@/components/address-list'
import { FAQ } from '@/components/FAQ'
import FeedbackSection from '@/components/FeedbackSection'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/components/file-upload'
import { Header } from '@/components/Header'
import { PrintPreview } from '@/components/print-preview'
import { HEADER_HEIGHT, SCROLL_DELAY } from '@/constants/ui'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'
import { cleanAddressData } from '@/lib/address-parser'
import { parseUniversalFile, type UniversalParseResult } from '@/lib/universal-parser'
import type { Address } from '@/types/address'

export default function Home() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [parseResult, setParseResult] = useState<UniversalParseResult | null>(null)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  const printPreviewRef = useRef<HTMLDivElement>(null)

  // Utility function for smooth scrolling with header offset
  const scrollToElement = useCallback((element: HTMLElement, offset: number = 0) => {
    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: Math.max(0, elementPosition), // Prevent negative scroll
      behavior: 'smooth',
    })
  }, [])

  // Scroll to print options after addresses are loaded
  const scrollToPrintOptions = useCallback(() => {
    const element = printPreviewRef.current
    if (element) {
      scrollToElement(element, HEADER_HEIGHT)
    }
  }, [scrollToElement])

  const handleFileContent = useCallback((content: string, filename: string) => {
    const result = parseUniversalFile(content)
    const cleanedAddresses = cleanAddressData(result.addresses)

    setAddresses(cleanedAddresses)
    setErrors(result.errors)
    setFileName(filename)
    setParseResult(result)

    // Déclencher l'auto-scroll seulement lors de l'import de fichier
    if (cleanedAddresses.length > 0) {
      setShouldAutoScroll(true)
    }
  }, [])

  // Auto-scroll to print options only when triggered by file import
  useEffect(() => {
    if (shouldAutoScroll && addresses.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToPrintOptions()
        setShouldAutoScroll(false) // Reset flag après le scroll
      }, SCROLL_DELAY)
      return () => clearTimeout(timeoutId)
    }
  }, [shouldAutoScroll, addresses.length, scrollToPrintOptions])

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
  }

  const handleDeleteAddress = (addressId: string) => {
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
  }

  const handleAddAddress = () => {
    setIsAddingAddress(true)
  }

  const handleSaveAddress = (address: Address) => {
    if (editingAddress) {
      // Mise à jour d'une adresse existante
      setAddresses((prev) => prev.map((addr) => (addr.id === address.id ? address : addr)))
      setEditingAddress(null)
    } else {
      // Ajout d'une nouvelle adresse
      setAddresses((prev) => [...prev, address])
      setIsAddingAddress(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingAddress(null)
    setIsAddingAddress(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header t={t} />

      {/* Main Content Area */}
      <main className="flex-1 bg-gradient-to-b from-white to-gray-50">
        {/* Background animé */}
        <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none" style={{ height: '700px' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
          {/* Gradient fade vers le bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative">
          {/* Hero Banner - Conditionnel selon connexion */}
          {user ? (
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
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-upload text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      {t('steps.1.title')}
                    </h3>
                    <p className="text-gray-600 text-xs">{t('steps.1.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-cog text-green-600 text-lg"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      {t('steps.2.title')}
                    </h3>
                    <p className="text-gray-600 text-xs">{t('steps.2.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-print text-purple-600 text-lg"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      {t('steps.3.title')}
                    </h3>
                    <p className="text-gray-600 text-xs">{t('steps.3.description')}</p>
                  </div>
                </div>
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
                  onClick={() => {
                    const fileUploadSection = document.getElementById('file-upload-section')
                    if (fileUploadSection) {
                      fileUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white px-8 py-4 rounded-lg text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span>{t('hero.cta.primary')}</span>
                  <i className="pi pi-arrow-right text-sm"></i>
                </button>
              </div>

              {/* Section processus 3 étapes - Version condensée */}
              <div id="steps-section" className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <i className="pi pi-upload text-blue-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t('steps.1.title')}</h3>
                    <p className="text-gray-600 text-sm">{t('steps.1.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <i className="pi pi-cog text-green-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t('steps.2.title')}</h3>
                    <p className="text-gray-600 text-sm">{t('steps.2.description')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <i className="pi pi-print text-purple-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t('steps.3.title')}</h3>
                    <p className="text-gray-600 text-sm">{t('steps.3.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Sections */}
          <div className="space-y-6 pb-12">
            {/* File Upload */}
            <div id="file-upload-section">
              <FileUpload onFileContent={handleFileContent} t={t} />
            </div>

            {/* Stats Card avec informations de détection */}
            {fileName && parseResult && (
              <div className="bg-white rounded-xl shadow-sm p-6">
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
                {addresses.length === 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <i className="pi pi-info-circle text-orange-500 text-sm mt-0.5"></i>
                      <div className="text-sm text-orange-800 flex-1">
                        <p className="font-medium mb-1">{t('status.noAddressFound')}</p>
                        <p className="mb-3">{t('status.checkFileFormat')}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-orange-700">{t('fileAnalysis.helpImprove')}</p>
                          <p className="text-xs text-orange-600 italic">
                            {t('fileAnalysis.privacy')}
                          </p>
                          <div className="flex justify-start">
                            <a
                              href={`mailto:contact@lalabel.app?subject=${encodeURIComponent(t('fileAnalysis.emailSubject'))}&body=${encodeURIComponent(t('fileAnalysis.emailBody'))}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-medium rounded-md transition-colors duration-200 border border-orange-300 hover:border-orange-400"
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
            {(addresses.length > 0 || errors.length > 0) && (
              <>
                <div ref={printPreviewRef}>
                  <PrintPreview addresses={addresses} t={t} />
                </div>
                <AddressList
                  addresses={addresses}
                  errors={errors}
                  onEditAddress={handleEditAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onAddAddress={handleAddAddress}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <FAQ t={t} />

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
