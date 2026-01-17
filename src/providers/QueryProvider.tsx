'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * Provider React Query avec configuration optimisée
 * 🎯 TTL longs car refreshUserPlan() gère les invalidations critiques
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 PLAN_CACHE : 12 heures
            staleTime: 12 * 60 * 60 * 1000, // 12h - Données considérées fraîches
            gcTime: 24 * 60 * 60 * 1000, // 24h - Garbage collection
            refetchOnWindowFocus: false, // Pas de refetch automatique au focus
            refetchOnMount: false, // Pas de refetch automatique au mount
            retry: 1, // 1 seul retry en cas d'échec
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
