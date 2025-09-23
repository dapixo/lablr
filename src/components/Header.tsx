'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import type React from 'react'
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

  // Éviter les erreurs d'hydratation en attendant que le client soit prêt
  useEffect(() => {
    setIsHydrated(true)
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
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Left Section - Brand */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <i className="pi pi-tag text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{t('brand.name')}</h1>
              <p className="text-sm text-gray-600 font-medium">{t('brand.tagline')}</p>
            </div>
          </Link>

          {/* Center Section - Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Navigation items can be added here if needed */}
          </nav>

          {/* Right Section - User Menu + Language Selector */}
          <div className="flex items-center gap-4">
            {isHydrated && !loading && user ? (
              <UserMenu />
            ) : isHydrated && !loading ? (
              <Link
                href={`/${locale}/login`}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center gap-1.5"
              >
                <i className="pi pi-sign-in text-xs"></i>
                {t('auth.buttons.signIn')}
              </Link>
            ) : null}

            {/* Sélecteur de langue */}
            {isHydrated && (
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isPending}
                className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
