'use client'

import { AlertTriangle, MapPin, Search, User } from 'lucide-react'
import { Button } from 'primereact/button'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Paginator } from 'primereact/paginator'
import { Panel } from 'primereact/panel'
import React, { useCallback, useMemo, useState } from 'react'
import { STORAGE_KEYS, useCollapsiblePanel } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Address } from '@/types/address'

interface AddressListProps {
  addresses: Address[]
  errors?: string[]
  className?: string
  onEditAddress?: (address: Address) => void
  onDeleteAddress?: (addressId: string) => void
  onAddAddress?: () => void
  onImportFile?: () => void
  onGenerateLabels?: () => void
  isManualMode?: boolean
  showGenerateButton?: boolean
  t: (key: string) => string
}

const ADDRESSES_PER_PAGE = 15

export function AddressList({
  addresses,
  errors = [],
  className,
  onEditAddress,
  onDeleteAddress,
  onAddAddress,
  onImportFile,
  onGenerateLabels,
  isManualMode = false,
  showGenerateButton = false,
  t,
}: AddressListProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Panel collapsible avec hook personnalisé
  const addressesPanel = useCollapsiblePanel(STORAGE_KEYS.ADDRESSES_PANEL_COLLAPSED, false)

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
  const { currentAddresses, totalAddresses, totalPages } = useMemo(() => {
    // Filtrage
    const filtered = !searchQuery.trim()
      ? addresses
      : addresses.filter((address) => {
          const query = searchQuery.toLowerCase()
          const searchableText =
            `${address.firstName} ${address.lastName} ${address.addressLine1} ${address.addressLine2 || ''} ${address.city} ${address.postalCode} ${address.country}`.toLowerCase()
          return searchableText.includes(query)
        })

    // Pagination
    const total = filtered.length
    const pages = Math.ceil(total / ADDRESSES_PER_PAGE)
    const start = currentPage * ADDRESSES_PER_PAGE
    const current = filtered.slice(start, start + ADDRESSES_PER_PAGE)

    return {
      currentAddresses: current,
      totalAddresses: total,
      totalPages: pages,
    }
  }, [addresses, searchQuery, currentPage])

  // Mémorisation des callbacks d'actions par adresse
  const createEditHandler = useCallback(
    (address: Address) => () => handleEditAddress(address),
    [handleEditAddress]
  )
  const createDeleteHandler = useCallback(
    (addressId: string) => () => handleDeleteAddress(addressId),
    [handleDeleteAddress]
  )

  // Mémorisation des adresses rendues pour la page courante
  const addressCards = useMemo(
    () =>
      currentAddresses.map((address) => (
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
  }, [])

  // Handler de changement de page mémorisé
  const handlePageChange = useCallback((event: { first: number; page: number }) => {
    setCurrentPage(event.page)
  }, [])

  // Handler de recherche debounced pour éviter trop de re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  if (addresses.length === 0 && errors.length === 0 && !isManualMode) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Panel
        header={
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-semibold text-gray-900">
              {t('addresses.title').replace('{count}', totalAddresses.toString())}
              {addresses.length !== totalAddresses &&
                ` ${t('addresses.totalFormat').replace('{filtered}', totalAddresses.toString()).replace('{total}', addresses.length.toString())}`}
            </span>
            {totalPages > 1 && (
              <span className="text-gray-600 font-normal ml-3 hidden sm:inline">
                -{' '}
                {t('addresses.pageInfo')
                  .replace('{current}', (currentPage + 1).toString())
                  .replace('{total}', totalPages.toString())}
              </span>
            )}
          </div>
        }
        className="w-full"
        toggleable
        collapsed={addressesPanel.isCollapsed}
        onToggle={addressesPanel.toggle}
      >
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              addresses={addresses}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              isManualMode={isManualMode}
              t={t}
            />
          </div>
          {/* Bouton "Ajouter une adresse" - Masqué en mode manuel avec 0 adresses (déjà dans EmptyManualState) */}
          {onAddAddress && !(isManualMode && addresses.length === 0) && (
            <Button
              onClick={onAddAddress}
              label={t('addresses.addButton')}
              icon="pi pi-plus"
              size="small"
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Info pagination mobile */}
        {totalPages > 1 && (
          <div className="text-xs text-gray-600 mb-3 sm:hidden">
            Page {currentPage + 1} sur {totalPages}
          </div>
        )}

        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-1rem w-1rem" />
              <span className="font-semibold text-900">
                {t('addresses.errors.title').replace('{count}', errors.length.toString())}
              </span>
            </div>
            <div className="flex flex-column gap-2">
              {errors.map((error, index) => (
                <Message key={index} severity="warn" text={error} className="w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Liste des adresses */}
        {totalAddresses > 0 ? (
          <>
            <div className="space-y-3">{addressCards}</div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Paginator
                  first={currentPage * ADDRESSES_PER_PAGE}
                  rows={ADDRESSES_PER_PAGE}
                  totalRecords={totalAddresses}
                  onPageChange={handlePageChange}
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                  currentPageReportTemplate={t('addresses.pagination.template')}
                  className="justify-content-center"
                />
              </div>
            )}

            {/* Bouton "Générer les étiquettes" - Affiché en dessous des adresses en mode manuel */}
            {showGenerateButton && onGenerateLabels && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={onGenerateLabels}
                  label={t('addresses.generateLabels')}
                  icon="pi pi-print"
                  className="p-button-primary p-button-lg"
                />
              </div>
            )}
          </>
        ) : searchQuery.trim() && addresses.length > 0 ? (
          <EmptySearchState t={t} />
        ) : isManualMode && addresses.length === 0 ? (
          <EmptyManualState t={t} onAddAddress={onAddAddress} onImportFile={onImportFile} />
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

const AddressCard = React.memo<AddressCardProps>(function AddressCard({
  address,
  onEdit,
  onDelete,
}) {
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
                  aria-label="Modifier l'adresse"
                />
              )}
              {onDelete && (
                <Button
                  onClick={onDelete}
                  icon="pi pi-trash"
                  className="p-button-text p-button-sm p-button-danger"
                  size="small"
                  aria-label="Supprimer l'adresse"
                />
              )}
            </div>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-600 ml-6">
          <div>{address.addressLine1}</div>
          {address.addressLine2 && <div>{address.addressLine2}</div>}
          <div>
            {address.postalCode} {address.city}
          </div>
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
              <span>
                {address.postalCode} {address.city}
              </span>
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
                aria-label="Modifier l'adresse"
              />
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                icon="pi pi-trash"
                className="p-button-text p-button-sm p-button-danger"
                size="small"
                aria-label="Supprimer l'adresse"
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
  isManualMode: boolean
  t: (key: string) => string
}

const SearchBar = React.memo<SearchBarProps>(function SearchBar({
  addresses,
  searchQuery,
  onSearchChange,
  isManualMode,
  t,
}) {
  // Afficher la recherche dès qu'il y a au moins 1 adresse
  if (addresses.length === 0) {
    return <div /> // Placeholder vide pour maintenir la structure flex
  }

  return (
    <IconField iconPosition="left">
      <InputIcon>
        <Search className="h-4 w-4" />
      </InputIcon>
      <InputText
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t('addresses.search.placeholder')}
        aria-label={t('addresses.search.placeholder')}
        className="w-full"
      />
    </IconField>
  )
})

// Composant EmptyState pour les recherches sans résultat
const EmptySearchState = React.memo(function EmptySearchState({
  t,
}: {
  t: (key: string) => string
}) {
  return (
    <div className="text-center py-6">
      <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <p className="text-gray-600 text-lg font-medium">{t('addresses.noResults.title')}</p>
      <p className="text-gray-500 text-sm">{t('addresses.noResults.description')}</p>
    </div>
  )
})

// Composant EmptyState pour le mode création manuelle
const EmptyManualState = React.memo(function EmptyManualState({
  t,
  onAddAddress,
  onImportFile,
}: {
  t: (key: string) => string
  onAddAddress?: () => void
  onImportFile?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <User className="h-8 w-8 text-blue-500" />
      </div>
      <p className="text-gray-600 text-lg font-medium mb-2">{t('addresses.emptyManual.title')}</p>
      <p className="text-gray-500 text-sm mb-6">{t('addresses.emptyManual.description')}</p>

      <div className="flex flex-col items-center gap-3">
        {onAddAddress && (
          <Button
            onClick={onAddAddress}
            label={t('addresses.emptyManual.addButton')}
            icon="pi pi-plus"
            className="p-button-primary"
          />
        )}
        {onImportFile && (
          <button
            type="button"
            onClick={onImportFile}
            aria-label={t('addresses.emptyManual.importLink')}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            {t('addresses.emptyManual.importLink')}
          </button>
        )}
      </div>
    </div>
  )
})
