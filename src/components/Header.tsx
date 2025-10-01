'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { UserMenu } from '@/components/auth/UserMenu'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  t: (key: string) => string
}

export function Header({ t }: HeaderProps) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const locale = (params?.locale as string) || 'fr'
  const { user, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isScrolled, setIsScrolled] = useState(false)

  // Éviter les erreurs d'hydratation en attendant que le client soit prêt
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Effet de scroll pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Gestion du changement de langue
  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      if (newLocale === locale || isPending) return

      startTransition(() => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
        router.push(newPath)
      })
    },
    [locale, pathname, router, isPending]
  )

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo Minimaliste */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <i className="pi pi-tag text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold text-gray-900">{t('brand.name')}</span>
          </Link>

          {/* Right Section - Navigation Horizontale */}
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href={`/${locale}/pricing`}
                className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {t('navigation.pricing')}
              </Link>
            </nav>

            {/* User Auth */}
            {isHydrated && !loading && user ? (
              <UserMenu />
            ) : isHydrated && !loading ? (
              <Link
                href={`/${locale}/login`}
                className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5"
              >
                <i className="pi pi-sign-in text-xs"></i>
                <span>{t('auth.buttons.signIn')}</span>
              </Link>
            ) : null}

            {/* Sélecteur de langue compact */}
            {isHydrated && (
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isPending}
                className="text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fr">Fr</option>
                <option value="en">En</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
