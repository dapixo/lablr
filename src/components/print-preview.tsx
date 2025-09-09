'use client'

import { Eye, Settings } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import { Panel } from 'primereact/panel'

import { PREVIEW_DIMENSIONS, PREVIEW_MAX_LABELS_ROLL, PREVIEW_MAX_PAGES } from '@/constants'
import { getPrintCSS, PRINT_FORMAT_LABELS } from '@/lib/print-formats'
import { printAddresses } from '@/lib/print-utils'
import { cn } from '@/lib/utils'
import type { Address, PrintFormat } from '@/types/address'

interface PrintPreviewProps {
  addresses: Address[]
  className?: string
}

export function PrintPreview({ addresses, className }: PrintPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('A4')
  const [showPreview, setShowPreview] = useState(false)

  const handlePrint = () => {
    const printCSS = getPrintCSS(selectedFormat)
    printAddresses(addresses, selectedFormat, printCSS)
  }

  if (addresses.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Panel 
        header={
          <div className="flex items-center gap-2">
            <Settings className="h-1rem w-1rem" />
            <span className="font-semibold text-900">Options d&apos;impression</span>
          </div>
        }
        className="w-full"
      >
        <div className="mb-3 text-600 text-sm">
          Choisissez le format d&apos;impression pour vos {addresses.length} adresses
        </div>
        {/* Sélecteur de format */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-900">Format d&apos;impression</div>
          <SelectButton
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.value)}
            options={(Object.keys(PRINT_FORMAT_LABELS) as PrintFormat[]).map(format => ({
              label: PRINT_FORMAT_LABELS[format],
              value: format
            }))}
            className="w-full"
          />
          <div className="text-xs text-500">
            {getFormatDescription(selectedFormat)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            label={showPreview ? 'Masquer' : 'Aperçu'}
            icon="pi pi-eye"
            className="p-button-secondary flex-1"
          />
          <Button
            onClick={handlePrint}
            label="Imprimer"
            icon="pi pi-print"
            className="flex-1"
          />
        </div>
      </Panel>

      {/* Aperçu */}
      {showPreview && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
              <Eye className="h-5 w-5" />
              Aperçu - {PRINT_FORMAT_LABELS[selectedFormat]}
            </div>
            <div className="text-sm text-gray-600">
              Visualisation réaliste du rendu d&apos;impression (échelle réduite)
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex justify-center bg-gray-100 p-6 rounded-lg">
              <PrintPreviewSheet addresses={addresses} format={selectedFormat} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PrintPreviewSheetProps {
  addresses: Address[]
  format: PrintFormat
}

const PrintPreviewSheet = React.memo<PrintPreviewSheetProps>(function PrintPreviewSheet({ addresses, format }) {
  // Calcul dimensions A4 mémorisé
  const dimensions = useMemo(() => ({
    height: PREVIEW_DIMENSIONS.A4_SHEET.height,
    width: PREVIEW_DIMENSIONS.A4_SHEET.height * PREVIEW_DIMENSIONS.A4_SHEET.ratio
  }), [])

  // Calculer le nombre de pages nécessaires
  const { addressesPerPage, totalPages, pagesToShow } = useMemo(() => {
    const perPage = format === 'A4_LABELS_10' ? 10 : 15
    const total = Math.ceil(addresses.length / perPage)
    const show = Math.min(PREVIEW_MAX_PAGES, total)
    return { addressesPerPage: perPage, totalPages: total, pagesToShow: show }
  }, [addresses.length, format])

  // Format rouleau : affichage spécial
  if (format === 'ROLL_57x32') {
    return <PrintPreviewRoll addresses={addresses} />
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: pagesToShow }, (_, pageIndex) => {
        const startIndex = pageIndex * addressesPerPage
        const pageAddresses = addresses.slice(startIndex, startIndex + addressesPerPage)

        return (
          <div
            key={pageIndex}
            className="bg-white shadow-lg border border-gray-300 relative overflow-hidden"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
          >
            {/* Marges visuelles */}
            <div
              className="absolute inset-0 border border-dashed border-gray-200"
              style={{ margin: '16px' }}
            />

            {/* Contenu de la page */}
            <div
              className="absolute inset-0 p-6 overflow-hidden"
              style={{ fontSize: '8px', lineHeight: '1.3' }}
            >
              {format === 'A4_LABELS_10' ? (
                <PrintPreviewLabels addresses={pageAddresses} />
              ) : (
                <PrintPreviewList addresses={pageAddresses} />
              )}
            </div>

            {/* Numéro de page */}
            <div className="absolute bottom-2 right-4 text-xs text-gray-400">
              Page {pageIndex + 1}
            </div>
          </div>
        )
      })}

      {totalPages > pagesToShow && (
        <div className="text-center text-sm text-gray-500 py-2">
          ... et {totalPages - pagesToShow} page{totalPages - pagesToShow > 1 ? 's' : ''}{' '}
          supplémentaire{totalPages - pagesToShow > 1 ? 's' : ''} ({addresses.length} adresses au
          total)
        </div>
      )}
    </div>
  )
})

const PrintPreviewLabels = React.memo<{ addresses: Address[] }>(function PrintPreviewLabels({ addresses }) {
  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {Array.from({ length: 10 }, (_, index) => {
        const address = addresses[index]
        return (
          <div
            key={index}
            className="border border-gray-400 rounded-sm bg-white flex flex-col justify-center items-center overflow-hidden"
            style={{
              height: '19%', // Plus grand pour 57mm sur 297mm
              minHeight: '80px', // Hauteur minimum pour la lisibilité
              padding: '6px',
              fontSize: '7px',
              lineHeight: '1.2',
              textAlign: 'center',
            }}
          >
            {address ? (
              <div className="w-full text-center overflow-hidden">
                <div className="font-bold text-black truncate mb-1">
                  {address.firstName} {address.lastName}
                </div>
                <div className="text-gray-700 truncate mb-1">{address.addressLine1}</div>
                {address.addressLine2 && (
                  <div className="text-gray-700 truncate mb-1">{address.addressLine2}</div>
                )}
                <div className="text-gray-700 truncate mb-1">
                  {address.postalCode} {address.city}
                </div>
                <div className="font-semibold text-gray-800 truncate">{address.country}</div>
              </div>
            ) : (
              <div className="text-gray-300 text-center text-xs">Étiquette vide</div>
            )}
          </div>
        )
      })}
    </div>
  )
})

const PrintPreviewList = React.memo<{ addresses: Address[] }>(function PrintPreviewList({ addresses }) {
  return (
    <div className="space-y-2 h-full overflow-hidden">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="border-b border-gray-300 pb-2"
          style={{ fontSize: '8px', lineHeight: '1.2' }}
        >
          <div className="space-y-0.5">
            <div className="font-semibold text-black">
              {address.firstName} {address.lastName}
            </div>
            <div className="text-gray-700">{address.addressLine1}</div>
            {address.addressLine2 && <div className="text-gray-700">{address.addressLine2}</div>}
            <div className="text-gray-700">
              {address.postalCode} {address.city}
            </div>
            <div className="font-medium text-gray-800">{address.country}</div>
          </div>
        </div>
      ))}
    </div>
  )
})

const PrintPreviewRoll = React.memo<{ addresses: Address[] }>(function PrintPreviewRoll({ addresses }) {
  // Dimensions rouleau
  const rollHeight = PREVIEW_DIMENSIONS.ROLL_LABEL.height
  const rollWidth = rollHeight * PREVIEW_DIMENSIONS.ROLL_LABEL.ratio

  const maxLabelsToShow = Math.min(PREVIEW_MAX_LABELS_ROLL, addresses.length)

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 text-center mb-4">
        Aperçu du rouleau d&apos;étiquettes 57×32mm (une étiquette par adresse)
      </div>
      
      <div className="flex flex-col items-center space-y-2 bg-gray-50 p-4 rounded-lg">
        {Array.from({ length: maxLabelsToShow }, (_, index) => {
          const address = addresses[index]
          
          return (
            <div
              key={index}
              className="bg-white shadow-md border border-gray-400 rounded-sm relative overflow-hidden"
              style={{
                width: `${rollWidth}px`,
                height: `${rollHeight}px`,
              }}
            >
              {/* Marges visuelles */}
              <div
                className="absolute inset-0 border border-dashed border-gray-200"
                style={{ margin: '4px' }}
              />

              {/* Contenu de l'étiquette */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2">
                {address ? (
                  <div className="w-full text-center overflow-hidden" style={{ fontSize: '9px', lineHeight: '1.1' }}>
                    <div className="font-bold text-black truncate mb-0.5">
                      {address.firstName} {address.lastName}
                    </div>
                    <div className="text-gray-700 truncate mb-0.5 text-xs">{address.addressLine1}</div>
                    {address.addressLine2 && (
                      <div className="text-gray-700 truncate mb-0.5 text-xs">{address.addressLine2}</div>
                    )}
                    <div className="text-gray-700 truncate mb-0.5 text-xs">
                      {address.postalCode} {address.city}
                    </div>
                    <div className="font-semibold text-gray-800 truncate text-xs">{address.country}</div>
                  </div>
                ) : (
                  <div className="text-gray-300 text-center text-xs">Étiquette vide</div>
                )}
              </div>

              {/* Numéro d'étiquette */}
              <div className="absolute top-1 right-1 text-xs text-gray-400 bg-white px-1 rounded">
                {index + 1}
              </div>
            </div>
          )
        })}
        
        {addresses.length > maxLabelsToShow && (
          <div className="text-center text-sm text-gray-500 py-2 flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span>
              ... et {addresses.length - maxLabelsToShow} étiquette{addresses.length - maxLabelsToShow > 1 ? 's' : ''} supplémentaire{addresses.length - maxLabelsToShow > 1 ? 's' : ''} 
              <br />
              ({addresses.length} étiquettes au total)
            </span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>
        )}
      </div>
    </div>
  )
})


function getFormatDescription(format: PrintFormat): string {
  switch (format) {
    case 'A4':
      return 'Une adresse par ligne, format classique'
    case 'A4_LABELS_10':
      return '10 étiquettes de 105×57mm par page'
    case 'ROLL_57x32':
      return 'Une étiquette 57×32mm par adresse'
    default:
      return ''
  }
}
