'use client'

import { useState } from 'react'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { confirmDialog } from 'primereact/confirmdialog'
import { AddressEditor } from '@/components/address-editor'
import { AddressList } from '@/components/address-list'
import { FileUpload } from '@/components/file-upload'
import { PrintPreview } from '@/components/print-preview'
import { cleanAddressData, parseAmazonSellerReport } from '@/lib/address-parser'
import type { Address } from '@/types/address'

export default function Home() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  const handleFileContent = (content: string, filename: string) => {
    const result = parseAmazonSellerReport(content)
    const cleanedAddresses = cleanAddressData(result.addresses)

    setAddresses(cleanedAddresses)
    setErrors(result.errors)
    setFileName(filename)
  }

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
      }
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
    <div className="min-h-screen surface-ground">
      {/* Header */}
      <header className="surface-section border-bottom-1 surface-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-2rem h-2rem border-round-lg bg-primary flex items-center justify-content-center">
              <span className="text-primary-color-text font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-900 m-0">Lablr</h1>
              <p className="text-sm text-600 m-0">
                Extracteur d&apos;adresses pour rapports Amazon Seller
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* File Upload */}
        <FileUpload onFileContent={handleFileContent} />

        {/* Results */}
        {(addresses.length > 0 || errors.length > 0) && (
          <>
            <PrintPreview addresses={addresses} />
            <AddressList
              addresses={addresses}
              errors={errors}
              onEditAddress={handleEditAddress}
              onDeleteAddress={handleDeleteAddress}
              onAddAddress={handleAddAddress}
            />
          </>
        )}

        {/* Stats */}
        {fileName && (
          <div className="text-center text-sm text-600">
            Fichier traité : <span className="font-semibold text-900">{fileName}</span>
            {addresses.length > 0 && (
              <span className="ml-2">• {addresses.length} adresse(s) extraite(s)</span>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="surface-section border-top-1 surface-border mt-6">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-600">
          <p className="m-0">Lablr - Micro SaaS pour l&apos;extraction d&apos;adresses Amazon Seller</p>
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
