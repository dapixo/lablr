'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { useAuth } from '@/hooks/useAuth'
import packageJson from '../../package.json'

interface FooterProps {
  t: (key: string) => string
}

export function Footer({ t }: FooterProps) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const locale = (params?.locale as string) || 'fr'
  const { user } = useAuth()
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
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 py-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <i className="pi pi-tag text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Lalabel</span>
            </div>
            <p className="text-gray-600 leading-relaxed pr-4">{t('footer.brand.description')}</p>
          </div>

          {/* Features Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
              {t('footer.features.title')}
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <i className="pi pi-check text-green-500 text-sm"></i>
                <span>{t('footer.features.multiPlatform')}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="pi pi-check text-green-500 text-sm"></i>
                <span>{t('footer.features.formats')}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="pi pi-check text-green-500 text-sm"></i>
                <span>{t('footer.features.editing')}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="pi pi-check text-green-500 text-sm"></i>
                <span>{t('footer.features.detection')}</span>
              </li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
              {t('footer.advantages.title')}
            </h4>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <i className="pi pi-shield text-blue-500 text-sm"></i>
                <span>{t('footer.advantages.security')}</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="pi pi-bolt text-blue-500 text-sm"></i>
                <span>{t('footer.advantages.speed')}</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="pi pi-mobile text-blue-500 text-sm"></i>
                <span>{t('footer.advantages.compatibility')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="text-gray-600 text-sm">{t('footer.copyright')}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`/${locale}/pricing`}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
                >
                  {t('navigation.pricing')}
                </Link>
                {isHydrated &&
                  (user ? (
                    <Link
                      href={`/${locale}/account`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
                    >
                      {t('footer.links.account')}
                    </Link>
                  ) : (
                    <Link
                      href={`/${locale}/login`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
                    >
                      {t('auth.buttons.signIn')}
                    </Link>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Sélecteur de langue */}
              {isHydrated && (
                <select
                  value={locale}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isPending}
                  className="text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={t('footer.languageSelector.label')}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="uppercase font-semibold tracking-wider">
                  {t('footer.version.label')}
                </span>
                <span className="font-medium text-gray-700">{packageJson.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
