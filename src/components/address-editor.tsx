'use client'

import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { useEffect, useState } from 'react'
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES } from '@/constants'
import type { Address } from '@/types/address'

interface AddressEditorProps {
  address?: Address
  isOpen: boolean
  onSave: (address: Address) => void
  onCancel: () => void
  title?: string
}

export function AddressEditor({
  address,
  isOpen,
  onSave,
  onCancel,
  title = "Éditer l'adresse",
}: AddressEditorProps) {
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: DEFAULT_COUNTRY,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Effect pour pré-remplir les champs quand une adresse est fournie
  useEffect(() => {
    if (address) {
      setFormData({
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        postalCode: address.postalCode || '',
        city: address.city || '',
        country: address.country || DEFAULT_COUNTRY,
      })
    } else {
      // Reset form pour nouvelle adresse
      setFormData({
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
        city: '',
        country: DEFAULT_COUNTRY,
      })
    }
    // Reset errors quand on change d'adresse
    setErrors({})
  }, [address])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'L&apos;adresse est obligatoire'
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Le code postal est obligatoire'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ville est obligatoire'
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Le pays est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const addressToSave: Address = {
      id: address?.id || `address-${Date.now()}`,
      ...formData,
    }

    onSave(addressToSave)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const countryOptions = SUPPORTED_COUNTRIES.map((country) => ({
    label: country,
    value: country,
  }))

  const footerContent = (
    <div className="flex gap-2">
      <Button label="Annuler" icon="pi pi-times" onClick={onCancel} outlined className="flex-1" />
      <Button
        label="Sauvegarder"
        icon="pi pi-check"
        onClick={handleSubmit}
        className="flex-1"
        autoFocus
      />
    </div>
  )

  return (
    <Dialog
      visible={isOpen}
      onHide={onCancel}
      header={title}
      footer={footerContent}
      className="w-full max-w-md"
      modal
      draggable={false}
      resizable={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium">
              Prénom *
            </label>
            <InputText
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Prénom"
              className={`w-full ${errors.firstName ? 'p-invalid' : ''}`}
            />
            {errors.firstName && (
              <Message severity="error" text={errors.firstName} className="mt-1" />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium">
              Nom
            </label>
            <InputText
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Nom"
              className="w-full"
            />
          </div>
        </div>

        {/* Adresse ligne 1 */}
        <div className="space-y-2">
          <label htmlFor="addressLine1" className="block text-sm font-medium">
            Adresse *
          </label>
          <InputText
            id="addressLine1"
            value={formData.addressLine1}
            onChange={(e) => handleInputChange('addressLine1', e.target.value)}
            placeholder="123 rue de la Paix"
            className={`w-full ${errors.addressLine1 ? 'p-invalid' : ''}`}
          />
          {errors.addressLine1 && (
            <Message severity="error" text={errors.addressLine1} className="mt-1" />
          )}
        </div>

        {/* Adresse ligne 2 */}
        <div className="space-y-2">
          <label htmlFor="addressLine2" className="block text-sm font-medium">
            Complément d&apos;adresse
          </label>
          <InputText
            id="addressLine2"
            value={formData.addressLine2}
            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            placeholder="Bât A, Appt 12"
            className="w-full"
          />
        </div>

        {/* Code postal et Ville */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="postalCode" className="block text-sm font-medium">
              Code postal *
            </label>
            <InputText
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="75001"
              className={`w-full ${errors.postalCode ? 'p-invalid' : ''}`}
            />
            {errors.postalCode && (
              <Message severity="error" text={errors.postalCode} className="mt-1" />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium">
              Ville *
            </label>
            <InputText
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Paris"
              className={`w-full ${errors.city ? 'p-invalid' : ''}`}
            />
            {errors.city && <Message severity="error" text={errors.city} className="mt-1" />}
          </div>
        </div>

        {/* Pays */}
        <div className="space-y-2">
          <label htmlFor="country" className="block text-sm font-medium">
            Pays *
          </label>
          <Dropdown
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.value)}
            options={countryOptions}
            placeholder="Sélectionner un pays"
            className={`w-full ${errors.country ? 'p-invalid' : ''}`}
          />
          {errors.country && <Message severity="error" text={errors.country} className="mt-1" />}
        </div>
      </form>
    </Dialog>
  )
}
