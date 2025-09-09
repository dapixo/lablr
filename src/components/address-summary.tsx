'use client'

import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Address } from '@/types/address'

interface AddressSummaryProps {
  addresses: Address[]
  errors?: string[]
  className?: string
}

export function AddressSummary({ addresses, errors = [], className }: AddressSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (addresses.length === 0 && errors.length === 0) {
    return null
  }

  const totalAddresses = addresses.length
  const uniqueCountries = new Set(addresses.map((addr) => addr.country)).size
  const uniqueCities = new Set(addresses.map((addr) => addr.city)).size

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle className="text-lg">
              {totalAddresses} adresse{totalAddresses > 1 ? 's' : ''} extraite
              {totalAddresses > 1 ? 's' : ''}
            </CardTitle>
          </div>

          {totalAddresses > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <CardDescription>
          {uniqueCities} ville{uniqueCities > 1 ? 's' : ''} • {uniqueCountries} pays
          {errors.length > 0 && (
            <span className="ml-2 text-amber-600">
              • {errors.length} erreur{errors.length > 1 ? 's' : ''}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalAddresses}</div>
              <div className="text-sm text-muted-foreground">Adresses</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{uniqueCities}</div>
              <div className="text-sm text-muted-foreground">Villes</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{uniqueCountries}</div>
              <div className="text-sm text-muted-foreground">Pays</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{errors.length}</div>
              <div className="text-sm text-muted-foreground">Erreurs</div>
            </div>
          </div>

          {/* Preview des premières adresses */}
          {addresses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Aperçu :</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {addresses.slice(0, 5).map((address) => (
                  <div
                    key={address.id}
                    className="text-sm p-2 bg-accent/30 rounded text-muted-foreground"
                  >
                    <span className="font-medium">
                      {address.firstName} {address.lastName}
                    </span>{' '}
                    - {address.city}, {address.country}
                  </div>
                ))}
                {addresses.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    ... et {addresses.length - 5} autre{addresses.length - 5 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-amber-700">Erreurs :</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {errors.slice(0, 3).map((error) => (
                  <div key={error} className="text-xs p-2 bg-amber-50 rounded text-amber-600">
                    {error}
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className="text-xs text-amber-600 text-center py-1">
                    ... et {errors.length - 3} autre{errors.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
