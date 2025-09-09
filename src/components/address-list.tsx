'use client'

import { AlertTriangle, MapPin, User } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { Message } from 'primereact/message'

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
      <Panel 
        headerTemplate={
          <div className="p-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1rem' }}>
            <div className="flex items-center gap-2">
              <MapPin className="h-1rem w-1rem" />
              <span className="font-semibold text-900">Adresses extraites ({addresses.length})</span>
            </div>
            
            {onAddAddress && (
              <Button
                onClick={onAddAddress}
                label="Ajouter une adresse"
                icon="pi pi-plus"
                size="small"
              />
            )}
          </div>
        }
        className="w-full"
      >
        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-1rem w-1rem" />
              <span className="font-semibold text-900">Erreurs de parsing ({errors.length})</span>
            </div>
            <div className="flex flex-column gap-2">
              {errors.map((error, index) => (
                <Message 
                  key={index}
                  severity="warn" 
                  text={error}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Liste des adresses */}
        {addresses.length > 0 && (
          <div className="space-y-3">
            {addressCards}
          </div>
        )}
      </Panel>
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
    <div className="surface-card p-3 border-round border-1 surface-border hover:surface-hover transition-colors transition-duration-200">
      <div className="flex items-center gap-3">
        <User className="h-1rem w-1rem text-500" />
        <div className="flex-1 flex flex-column gap-1">
          <div className="font-semibold text-900 text-sm">
            {address.firstName} {address.lastName}
          </div>

          <div className="text-sm text-600 flex flex-column gap-1">
            <div>{address.addressLine1}</div>
            {address.addressLine2 && <div>{address.addressLine2}</div>}
            <div>
              {address.postalCode} {address.city}
            </div>
            <div className="font-semibold text-700">{address.country}</div>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex flex-column gap-1">
            {onEdit && (
              <Button
                onClick={onEdit}
                icon="pi pi-pencil"
                className="p-button-text p-button-sm"
              />
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                icon="pi pi-trash"
                className="p-button-text p-button-sm p-button-danger"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})
