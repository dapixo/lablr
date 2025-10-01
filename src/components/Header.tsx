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
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Left Section - Brand Compact */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <i className="pi pi-tag text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('brand.name')}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{t('brand.tagline')}</p>
            </div>
          </Link>

          {/* Right Section - Navigation + User + Language */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 mr-4">
              <Link
                href={`/${locale}/pricing`}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {t('navigation.pricing')}
              </Link>
            </nav>

            {/* CTA Button */}
            <button
              onClick={() => {
                const fileUploadSection = document.getElementById('file-upload-section')
                if (fileUploadSection) {
                  fileUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 shadow-md hover:shadow-lg"
            >
              <i className="pi pi-upload text-xs"></i>
              <span className="hidden sm:inline">{t('navigation.getStarted')}</span>
              <span className="sm:hidden">Import</span>
            </button>

            {/* User Auth */}
            {isHydrated && !loading && user ? (
              <UserMenu />
            ) : isHydrated && !loading ? (
              <Link
                href={`/${locale}/login`}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center gap-1.5"
              >
                <i className="pi pi-sign-in text-xs"></i>
                <span className="hidden md:inline">{t('auth.buttons.signIn')}</span>
              </Link>
            ) : null}

            {/* Sélecteur de langue */}
            {isHydrated && (
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isPending}
                className="text-xs md:text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
