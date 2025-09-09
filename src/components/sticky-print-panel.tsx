'use client'

import { Eye, Printer, Settings } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPrintCSS, PRINT_FORMAT_LABELS } from '@/lib/print-formats'
import { printAddresses } from '@/lib/print-utils'
import { cn } from '@/lib/utils'
import type { Address, PrintFormat } from '@/types/address'

interface StickyPrintPanelProps {
  addresses: Address[]
  className?: string
}

export function StickyPrintPanel({ addresses, className }: StickyPrintPanelProps) {
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
    <>
      {/* Sticky Panel */}
      <div className={cn('fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]', className)}>
        <Card className="shadow-lg border-2">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium text-sm">Impression</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {addresses.length} adresse{addresses.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Format Selector - Compact */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as PrintFormat)}
                className="w-full text-sm p-2 border rounded-md bg-background"
              >
                {(Object.keys(PRINT_FORMAT_LABELS) as PrintFormat[]).map((format) => (
                  <option key={format} value={format}>
                    {PRINT_FORMAT_LABELS[format]}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showPreview ? 'Masquer' : 'Aperçu'}
              </Button>
              <Button type="button" onClick={handlePrint} size="sm" className="flex-1">
                <Printer className="h-3 w-3 mr-1" />
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal/Overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Aperçu - {PRINT_FORMAT_LABELS[selectedFormat]}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                ×
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <div className="border rounded-lg p-4 bg-white">
                <PrintPreviewContent addresses={addresses} format={selectedFormat} />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button
                type="button"
                onClick={() => setShowPreview(false)}
                variant="outline"
                className="flex-1"
              >
                Fermer
              </Button>
              <Button type="button" onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface PrintPreviewContentProps {
  addresses: Address[]
  format: PrintFormat
}

function PrintPreviewContent({ addresses, format }: PrintPreviewContentProps) {
  if (format === 'A4_LABELS_10') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="border border-gray-300 p-2 text-xs h-20 flex flex-col justify-center"
          >
            <AddressContent address={address} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <div key={address.id} className="border-b border-gray-200 pb-2">
          <AddressContent address={address} />
        </div>
      ))}
    </div>
  )
}

function AddressContent({ address }: { address: Address }) {
  return (
    <div className="space-y-1">
      <div className="font-medium">
        {address.firstName} {address.lastName}
      </div>
      <div>{address.addressLine1}</div>
      {address.addressLine2 && <div>{address.addressLine2}</div>}
      <div>
        {address.postalCode} {address.city}
      </div>
      <div>{address.country}</div>
    </div>
  )
}

