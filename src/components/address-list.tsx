'use client'

import { AlertTriangle, MapPin, Search, User } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { Message } from 'primereact/message'
import { Paginator } from 'primereact/paginator'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'

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

const ADDRESSES_PER_PAGE = 15

export function AddressList({
  addresses,
  errors = [],
  className,
  onEditAddress,
  onDeleteAddress,
  onAddAddress,
}: AddressListProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Mémorisation des callbacks pour éviter les re-renders inutiles
  const handleEditAddress = useCallback(
    (address: Address) => onEditAddress?.(address),
    [onEditAddress]
  )

  const handleDeleteAddress = useCallback(
    (addressId: string) => onDeleteAddress?.(addressId),
    [onDeleteAddress]
  )

  // Combinaison optimisée : filtrage + pagination en un seul useMemo
  const { filteredAddresses, currentAddresses, totalAddresses, totalPages } = useMemo(() => {
    // Filtrage
    const filtered = !searchQuery.trim() 
      ? addresses 
      : addresses.filter(address => {
          const query = searchQuery.toLowerCase()
          const searchableText = `${address.firstName} ${address.lastName} ${address.addressLine1} ${address.addressLine2 || ''} ${address.city} ${address.postalCode} ${address.country}`.toLowerCase()
          return searchableText.includes(query)
        })
    
    // Pagination
    const total = filtered.length
    const pages = Math.ceil(total / ADDRESSES_PER_PAGE)
    const start = currentPage * ADDRESSES_PER_PAGE
    const current = filtered.slice(start, start + ADDRESSES_PER_PAGE)
    
    return {
      filteredAddresses: filtered,
      currentAddresses: current,
      totalAddresses: total,
      totalPages: pages
    }
  }, [addresses, searchQuery, currentPage])

  // Mémorisation des callbacks d'actions par adresse
  const createEditHandler = useCallback((address: Address) => () => handleEditAddress(address), [handleEditAddress])
  const createDeleteHandler = useCallback((addressId: string) => () => handleDeleteAddress(addressId), [handleDeleteAddress])

  // Mémorisation des adresses rendues pour la page courante
  const addressCards = useMemo(
    () => currentAddresses.map((address) => (
      <AddressCard
        key={address.id}
        address={address}
        onEdit={onEditAddress ? createEditHandler(address) : undefined}
        onDelete={onDeleteAddress ? createDeleteHandler(address.id) : undefined}
      />
    )),
    [currentAddresses, onEditAddress, onDeleteAddress, createEditHandler, createDeleteHandler]
  )

  // Reset page when addresses or search query change
  React.useEffect(() => {
    setCurrentPage(0)
  }, [addresses.length, searchQuery])

  // Handler de changement de page mémorisé
  const handlePageChange = useCallback((event: { first: number; page: number }) => {
    setCurrentPage(event.page)
  }, [])

  // Handler de recherche debounced pour éviter trop de re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  if (addresses.length === 0 && errors.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Panel 
        headerTemplate={
          <div className="p-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1rem' }}>
            {/* Mobile Header */}
            <div className="block sm:hidden w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    Adresses ({totalAddresses}{addresses.length !== totalAddresses && `/${addresses.length}`})
                  </span>
                </div>
                {onAddAddress && (
                  <Button
                    onClick={onAddAddress}
                    icon="pi pi-plus"
                    size="small"
                    className="p-button-sm"
                  />
                )}
              </div>
              {totalPages > 1 && (
                <div className="text-xs text-gray-600 ml-6">
                  Page {currentPage + 1} sur {totalPages}
                </div>
              )}
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex items-center gap-3 flex-1">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Adresses extraites ({totalAddresses}{addresses.length !== totalAddresses && ` sur ${addresses.length}`})
                {totalPages > 1 && (
                  <span className="text-gray-600 font-normal ml-3">
                    - Page {currentPage + 1} sur {totalPages}
                  </span>
                )}
              </span>
            </div>
            
            <div className="hidden sm:block">
              {onAddAddress && (
                <Button
                  onClick={onAddAddress}
                  label="Ajouter une adresse"
                  icon="pi pi-plus"
                  size="small"
                />
              )}
            </div>
          </div>
        }
        className="w-full"
      >
        <SearchBar 
          addresses={addresses}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

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
        {totalAddresses > 0 ? (
          <>
            <div className="space-y-3">
              {addressCards}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Paginator
                  first={currentPage * ADDRESSES_PER_PAGE}
                  rows={ADDRESSES_PER_PAGE}
                  totalRecords={totalAddresses}
                  onPageChange={handlePageChange}
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                  currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} adresses"
                  className="justify-content-center"
                />
              </div>
            )}
          </>
        ) : searchQuery.trim() && addresses.length > 0 ? (
          <EmptySearchState />
        ) : null}
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
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="font-semibold text-gray-900 text-sm">
              {address.firstName} {address.lastName}
            </div>
          </div>
          {/* Mobile Actions */}
          {(onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  onClick={onEdit}
                  icon="pi pi-pencil"
                  className="p-button-text p-button-sm"
                  size="small"
                />
              )}
              {onDelete && (
                <Button
                  onClick={onDelete}
                  icon="pi pi-trash"
                  className="p-button-text p-button-sm p-button-danger"
                  size="small"
                />
              )}
            </div>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-600 ml-6">
          <div>{address.addressLine1}</div>
          {address.addressLine2 && <div>{address.addressLine2}</div>}
          <div>{address.postalCode} {address.city}</div>
          <div className="font-medium text-gray-700">{address.country}</div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-4">
        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm mb-1">
            {address.firstName} {address.lastName}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="truncate">{address.addressLine1}</div>
            {address.addressLine2 && <div className="truncate">{address.addressLine2}</div>}
            <div className="flex gap-4">
              <span>{address.postalCode} {address.city}</span>
              <span className="font-medium text-gray-700">{address.country}</span>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        {(onEdit || onDelete) && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {onEdit && (
              <Button
                onClick={onEdit}
                icon="pi pi-pencil"
                className="p-button-text p-button-sm"
                size="small"
              />
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                icon="pi pi-trash"
                className="p-button-text p-button-sm p-button-danger"
                size="small"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})

// Composant SearchBar séparé pour une meilleure lisibilité
interface SearchBarProps {
  addresses: Address[]
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const SearchBar = React.memo<SearchBarProps>(function SearchBar({ addresses, searchQuery, onSearchChange }) {
  if (addresses.length <= 5) return null

  return (
    <div className="mb-4">
      <IconField iconPosition="left">
        <InputIcon>
          <Search className="h-4 w-4" />
        </InputIcon>
        <InputText
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher par nom, adresse, ville, pays..."
          className="w-full"
        />
      </IconField>
    </div>
  )
})

// Composant EmptyState pour les recherches sans résultat
const EmptySearchState = React.memo(function EmptySearchState() {
  return (
    <div className="text-center py-6">
      <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <p className="text-gray-600 text-lg font-medium">Aucun résultat trouvé</p>
      <p className="text-gray-500 text-sm">
        Essayez avec d&apos;autres mots-clés ou vérifiez l&apos;orthographe
      </p>
    </div>
  )
})
