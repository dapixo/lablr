'use client'

import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddressEditor } from '@/components/address-editor'
import { AddressList } from '@/components/address-list'
import { UserMenu } from '@/components/auth/UserMenu'
import { FAQ } from '@/components/FAQ'
import { FileUpload } from '@/components/file-upload'
import { PrintPreview } from '@/components/print-preview'
import { useAuth } from '@/hooks/useAuth'
import { cleanAddressData } from '@/lib/address-parser'
import { parseUniversalFile, type UniversalParseResult } from '@/lib/universal-parser'
import type { Address } from '@/types/address'

// Constants
const HEADER_HEIGHT = 80 // px - Height of sticky header
const SCROLL_DELAY = 100 // ms - Delay to ensure component rendering

export default function Home() {
  const { user, loading } = useAuth()
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
      message: 'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
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
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Brand Section */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <i className="pi pi-tag text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">Lablr</h1>
                <p className="text-sm text-gray-600 font-medium">
                  Solution professionnelle d&apos;extraction d&apos;adresses
                </p>
              </div>
            </div>

            {/* Navigation/Actions */}
            <div className="flex items-center gap-3">
              {!loading &&
                (user ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <i className="pi pi-user text-blue-600 text-sm"></i>
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                      {user.email?.split('@')[0]}
                    </span>
                    <UserMenu />
                  </div>
                ) : null)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          {
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
              <div className="mb-6">
                <i className="pi pi-cloud-upload text-6xl text-blue-500 mb-4 block"></i>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Bienvenue sur Lablr</h2>
                <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                  Importez vos données de n&apos;importe quelle plateforme e-commerce et
                  transformez-les en étiquettes d&apos;expédition professionnelles en quelques
                  clics.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-upload text-blue-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">1. Importez</h3>
                  <p className="text-gray-600 text-sm">
                    Glissez votre fichier d&apos;adresses (Amazon, Shopify, eBay...)
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-cog text-green-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">2. Configurez</h3>
                  <p className="text-gray-600 text-sm">Choisissez votre format d&apos;impression</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-print text-orange-500 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">3. Imprimez</h3>
                  <p className="text-gray-600 text-sm">
                    Obtenez vos étiquettes parfaitement formatées
                  </p>
                </div>
              </div>
            </div>
          }

          {/* Content Sections */}
          <div className="space-y-6">
            {/* File Upload */}
            <FileUpload onFileContent={handleFileContent} />

            {/* Results */}
            {(addresses.length > 0 || errors.length > 0) && (
              <>
                <div ref={printPreviewRef}>
                  <PrintPreview addresses={addresses} />
                </div>
                <AddressList
                  addresses={addresses}
                  errors={errors}
                  onEditAddress={handleEditAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onAddAddress={handleAddAddress}
                />
              </>
            )}

            {/* Stats Card avec informations de détection */}
            {fileName && parseResult && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                      <i className="pi pi-check text-green-500 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fichier traité avec succès</p>
                      <p className="font-semibold text-gray-900">{fileName}</p>
                    </div>
                  </div>
                  {addresses.length > 0 && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-500 mb-1">{addresses.length}</p>
                      <p className="text-sm text-gray-600">
                        adresse{addresses.length > 1 ? 's' : ''} extraite
                        {addresses.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <FAQ />

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-3 gap-8 py-12">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <i className="pi pi-tag text-white text-sm"></i>
                </div>
                <span className="text-xl font-bold text-gray-900">Lablr</span>
              </div>
              <p className="text-gray-600 leading-relaxed pr-4">
                Solution professionnelle pour l&apos;extraction et l&apos;impression
                d&apos;étiquettes à partir de toutes vos plateformes e-commerce.
              </p>
            </div>

            {/* Features Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Fonctionnalités</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <i className="pi pi-check text-green-500 text-sm"></i>
                  <span>Import multi-plateformes (Amazon, Shopify, eBay...)</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="pi pi-check text-green-500 text-sm"></i>
                  <span>Formats A4 et étiquettes</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="pi pi-check text-green-500 text-sm"></i>
                  <span>Édition des adresses</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="pi pi-check text-green-500 text-sm"></i>
                  <span>Détection automatique des formats</span>
                </li>
              </ul>
            </div>

            {/* Info Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Avantages</h4>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-3">
                  <i className="pi pi-shield text-blue-500 text-sm"></i>
                  <span>Traitement local sécurisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="pi pi-bolt text-blue-500 text-sm"></i>
                  <span>Interface moderne et rapide</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="pi pi-mobile text-blue-500 text-sm"></i>
                  <span>Compatible tous appareils</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="border-t border-gray-200 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-sm">© 2024 Lablr. Tous droits réservés.</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="uppercase font-semibold tracking-wider">Version</span>
                  <span className="font-medium text-gray-700">2.1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Editor Modal */}
      <AddressEditor
        address={editingAddress || undefined}
        isOpen={!!editingAddress || isAddingAddress}
        onSave={handleSaveAddress}
        onCancel={handleCancelEdit}
        title={editingAddress ? "Éditer l'adresse" : 'Ajouter une adresse'}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
