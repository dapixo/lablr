'use client'

import { AlertTriangle, Edit3, MapPin, Plus, Trash2, User } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Address } from '@/types/address'

interface AddressListProps {
  addresses: Address[]
  errors?: string[]
  className?: string
  onEditAddress?: (address: Address) => void
  onDeleteAddress?: (addressId: string) => void
  onAddAddress?: () => void
}

export function AddressList({
  addresses,
  errors = [],
  className,
  onEditAddress,
  onDeleteAddress,
  onAddAddress,
}: AddressListProps) {
  // Mémorisation des callbacks pour éviter les re-renders inutiles
  const handleEditAddress = useCallback(
    (address: Address) => onEditAddress?.(address),
    [onEditAddress]
  )

  const handleDeleteAddress = useCallback(
    (addressId: string) => onDeleteAddress?.(addressId),
    [onDeleteAddress]
  )

  // Mémorisation des adresses rendues
  const addressCards = useMemo(
    () =>
      addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEditAddress ? () => handleEditAddress(address) : undefined}
          onDelete={onDeleteAddress ? () => handleDeleteAddress(address.id) : undefined}
        />
      )),
    [addresses, onEditAddress, onDeleteAddress, handleEditAddress, handleDeleteAddress]
  )

  if (addresses.length === 0 && errors.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresses extraites ({addresses.length})
            </CardTitle>

            {onAddAddress && (
              <Button
                type="button"
                onClick={onAddAddress}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une adresse
              </Button>
            )}
          </div>

          {errors.length > 0 && (
            <CardDescription className="text-amber-600">
              {errors.length} erreur(s) détectée(s) lors du parsing
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Affichage des erreurs */}
          {errors.length > 0 && (
            <div className="mb-4 space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Erreurs de parsing
              </h4>
              <div className="space-y-1">
                {errors.map((error) => (
                  <p key={error} className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Liste des adresses */}
          {addresses.length > 0 && <div className="space-y-3">{addressCards}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

interface AddressCardProps {
  address: Address
  onEdit?: () => void
  onDelete?: () => void
}

const AddressCard = React.memo<AddressCardProps>(function AddressCard({ address, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <User className="h-4 w-4 mt-1 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm">
            {address.firstName} {address.lastName}
          </div>

          <div className="text-sm text-muted-foreground space-y-0.5">
            <div>{address.addressLine1}</div>
            {address.addressLine2 && <div>{address.addressLine2}</div>}
            <div>
              {address.postalCode} {address.city}
            </div>
            <div className="font-medium">{address.country}</div>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex flex-col gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                title="Éditer l'adresse"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Supprimer l'adresse"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
