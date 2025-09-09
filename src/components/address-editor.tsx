'use client'

import { Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'

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
    country: 'France',
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
        country: address.country || 'France',
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
        country: 'France',
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-auto bg-white shadow-2xl rounded-lg border">
        <div className="bg-white rounded-t-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold leading-none tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onCancel}
              className="h-auto p-1 bg-transparent border-none cursor-pointer hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600">Modifiez les informations de l&apos;adresse</p>
        </div>

        <div className="bg-white rounded-b-lg p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-gray-900">Prénom *</label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Prénom"
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && (
                  <p id="firstName-error" className="mt-1 text-xs text-red-600" role="alert">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-gray-900">Nom</label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom"
                />
              </div>
            </div>

            {/* Adresse ligne 1 */}
            <div>
              <label htmlFor="addressLine1" className="text-sm font-medium text-gray-900">Adresse *</label>
              <input
                id="addressLine1"
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="123 rue de la Paix"
                aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
              />
              {errors.addressLine1 && (
                <p id="addressLine1-error" className="mt-1 text-xs text-red-600" role="alert">{errors.addressLine1}</p>
              )}
            </div>

            {/* Adresse ligne 2 */}
            <div>
              <label htmlFor="addressLine2" className="text-sm font-medium text-gray-900">Complément d&apos;adresse</label>
              <input
                id="addressLine2"
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bât A, Appt 12"
              />
            </div>

            {/* Code postal et Ville */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="postalCode" className="text-sm font-medium text-gray-900">Code postal *</label>
                <input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="75001"
                  aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
                />
                {errors.postalCode && (
                  <p id="postalCode-error" className="mt-1 text-xs text-red-600" role="alert">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="text-sm font-medium text-gray-900">Ville *</label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Paris"
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city && <p id="city-error" className="mt-1 text-xs text-red-600" role="alert">{errors.city}</p>}
              </div>
            </div>

            {/* Pays */}
            <div>
              <label htmlFor="country" className="text-sm font-medium text-gray-900">Pays *</label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                aria-describedby={errors.country ? 'country-error' : undefined}
              >
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Canada">Canada</option>
                <option value="États-Unis">États-Unis</option>
                <option value="Allemagne">Allemagne</option>
                <option value="Italie">Italie</option>
                <option value="Espagne">Espagne</option>
                <option value="Royaume-Uni">Royaume-Uni</option>
                <option value="Pays-Bas">Pays-Bas</option>
              </select>
              {errors.country && <p id="country-error" className="mt-1 text-xs text-red-600" role="alert">{errors.country}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent inline-flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
