import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'

/**
 * Skeleton unifié pour la page Account
 * Représente toute la structure de la page pour éviter le layout shift
 */
export function AccountPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
          <div className="mb-6">
            <Skeleton shape="circle" size="4rem" className="mx-auto mb-4" />
            <Skeleton width="12rem" height="2rem" className="mx-auto mb-3" />
            <Skeleton width="20rem" height="1.5rem" className="mx-auto" />
          </div>
        </div>

        {/* Status du compte Skeleton */}
        <Card className="mb-6">
          <div className="space-y-6">
            <Skeleton width="10rem" height="1.5rem" className="mb-4" />

            {/* Plan actuel skeleton */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton shape="circle" size="2.5rem" />
                  <div>
                    <Skeleton width="8rem" height="1rem" className="mb-2" />
                    <Skeleton width="6rem" height="0.875rem" />
                  </div>
                </div>
                <Skeleton width="5rem" height="1.5rem" borderRadius="9999px" />
              </div>
            </div>
          </div>
        </Card>

        {/* Informations utilisateur Skeleton */}
        <Card className="mb-6">
          <div className="space-y-6">
            <Skeleton width="12rem" height="1.5rem" className="mb-4" />

            {/* Nom complet */}
            <div className="border-b border-gray-200 pb-4">
              <Skeleton width="6rem" height="0.875rem" className="mb-2" />
              <Skeleton width="10rem" height="1.5rem" />
            </div>

            {/* Email */}
            <div className="border-b border-gray-200 pb-4">
              <Skeleton width="4rem" height="0.875rem" className="mb-2" />
              <Skeleton width="14rem" height="1.5rem" />
            </div>

            {/* Date de création */}
            <div>
              <Skeleton width="8rem" height="0.875rem" className="mb-2" />
              <Skeleton width="12rem" height="1rem" />
            </div>
          </div>
        </Card>

        {/* Zone de danger Skeleton */}
        <Card className="border-red-200 bg-red-50">
          <div className="space-y-4">
            <Skeleton width="10rem" height="1.5rem" className="mb-2" />
            <Skeleton width="100%" height="1rem" />

            <div className="pt-4 border-t border-red-200">
              <Skeleton width="10rem" height="2.5rem" borderRadius="0.375rem" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
