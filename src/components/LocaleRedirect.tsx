'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/**
 * Props pour le composant de redirection
 */
interface LocaleRedirectProps {
  /** Chemin cible (ex: "/account", "/pricing") */
  targetPath: string
}

/**
 * Contenu du composant de redirection avec détection de locale
 * Nécessaire pour éviter l'erreur useSearchParams dans un composant sans Suspense
 */
function LocaleRedirectContent({ targetPath }: LocaleRedirectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Détecter la langue préférée du navigateur ou utiliser 'fr' par défaut
    const browserLang = navigator.language.toLowerCase()
    const locale = browserLang.startsWith('en')
      ? 'en'
      : browserLang.startsWith('es')
        ? 'es'
        : 'fr'

    // Préserver les query params
    const queryString = searchParams.toString()
    const redirectUrl = `/${locale}${targetPath}${queryString ? `?${queryString}` : ''}`

    router.replace(redirectUrl)
  }, [router, searchParams, targetPath])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirection...</p>
      </div>
    </div>
  )
}

/**
 * Composant de redirection générique avec locale automatique
 * Utilisé pour les pages sans locale (ex: /account, /pricing)
 * qui reçoivent des redirections de services externes (Dodo Payments)
 */
export default function LocaleRedirect({ targetPath }: LocaleRedirectProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LocaleRedirectContent targetPath={targetPath} />
    </Suspense>
  )
}
