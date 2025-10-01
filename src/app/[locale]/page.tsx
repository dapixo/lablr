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
  const { userPlan } = useAuth()
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
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Banner - Conditionnel selon le statut premium */}
          {userPlan === 'premium' ? (
            // Hero Premium - Version actuelle épurée
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
              <div className="mb-6">
                <i className="pi pi-cloud-upload text-6xl text-blue-500 mb-4 block"></i>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('header.welcome')}</h2>
                <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                  {t('header.description')}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-upload text-blue-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{t('steps.1.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('steps.1.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-cog text-green-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{t('steps.2.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('steps.2.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-print text-orange-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{t('steps.3.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('steps.3.description')}</p>
                </div>
              </div>
            </div>
          ) : (
            // Hero Non-Premium - Style micro-SaaS friendly
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-sm p-8 mb-8">
              <div className="text-center mb-8">
                {/* Section Problème - Ton positif */}
                <div className="mb-8">
                  <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <i className="pi pi-file text-blue-600 text-xl"></i>
                    </div>
                    <i className="pi pi-arrow-right text-gray-400 text-lg"></i>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <i className="pi pi-print text-green-600 text-xl"></i>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {t('hero.problem.title')}
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto mb-6">
                    {t('hero.problem.description')}
                  </p>
                </div>

                {/* Transition Solution */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent flex-1"></div>
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full font-medium text-sm shadow-lg">
                    {t('hero.solution.transition')}
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent flex-1"></div>
                </div>

                {/* Solution Lalabel */}
                <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <i className="pi pi-sparkles text-white text-xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {t('hero.solution.title')}
                    </h2>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
                    {t('hero.solution.description')}
                  </p>
                </div>
              </div>

              {/* Bénéfices avec nouveau titre */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                  {t('hero.benefits.title')}
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-clock text-green-600 text-xl"></i>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">95%</div>
                    <p className="text-gray-600 text-sm">{t('hero.benefits.timeReduction')}</p>
                  </div>
                  <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-check-circle text-blue-600 text-xl"></i>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
                    <p className="text-gray-600 text-sm">{t('hero.benefits.simplicity')}</p>
                  </div>
                  <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <i className="pi pi-shield text-purple-600 text-xl"></i>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
                    <p className="text-gray-600 text-sm">{t('hero.benefits.accuracy')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Sections */}
          <div className="space-y-6">
            {/* File Upload */}
            <div id="file-upload-section">
              <FileUpload onFileContent={handleFileContent} t={t} />
            </div>

            {/* Stats Card avec informations de détection */}
            {fileName && parseResult && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      addresses.length > 0
                        ? 'bg-green-50'
                        : 'bg-orange-50'
                    }`}>
                      <i className={`text-xl ${
                        addresses.length > 0
                          ? 'pi pi-check text-green-500'
                          : 'pi pi-exclamation-triangle text-orange-500'
                      }`}></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('status.fileProcessed')}</p>
                      <p className="font-semibold text-gray-900">{fileName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold mb-1 ${
                      addresses.length > 0 ? 'text-blue-500' : 'text-orange-500'
                    }`}>
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
                          <p className="text-xs text-orange-700">
                            {t('fileAnalysis.helpImprove')}
                          </p>
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
