'use client'

import Link from 'next/link'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  t: (key: string) => string
}

export function Header({ t }: HeaderProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale = (params?.locale as string) || 'fr'
  const { user, loading, userPlan, signOut } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)
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

  // Effet pour gérer le hash #faq après navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#faq') {
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        const faqSection = document.getElementById('faq')
        if (faqSection) {
          // Compenser la hauteur du header sticky (64px = h-16)
          const headerOffset = 80
          const elementPosition = faqSection.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })
        }
      }, 100)
    }
  }, [pathname])

  // Handler pour le lien FAQ
  const handleFaqClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const isOnHomePage = pathname === `/${locale}` || pathname === `/${locale}/`

    if (isOnHomePage) {
      // Si on est déjà sur la home, scroll vers la section FAQ
      const faqSection = document.getElementById('faq')
      if (faqSection) {
        const headerOffset = 80
        const elementPosition = faqSection.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    } else {
      // Si on est sur une autre page, naviguer vers la home avec hash
      router.push(`/${locale}#faq`)
    }
  }

  // Handler pour la déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [signOut, router, locale])

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

          {/* Right Section - Navigation */}
          <div className="flex items-center gap-6">
            {!isHydrated || loading ? (
              // Skeleton pendant le chargement
              <div className="hidden md:flex items-center gap-6 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              // Mode connecté : Mon compte, FAQ, Upgrade (si pas premium), Déconnexion
              <>
                  <Link
                    href={`/${locale}/account`}
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5"
                  >
                    <i className="pi pi-user text-xs"></i>
                    <span>{t('navigation.account')}</span>
                  </Link>
                  <a
                    href={`/${locale}#faq`}
                    onClick={handleFaqClick}
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="pi pi-question-circle text-xs"></i>
                    <span>{t('navigation.faq')}</span>
                  </a>
                  {userPlan !== 'premium' && (
                    <Link
                      href={`/${locale}/pricing`}
                      className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5"
                    >
                      <i className="pi pi-star text-xs"></i>
                      <span>{t('navigation.upgrade')}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="pi pi-sign-out text-xs"></i>
                    <span>{t('navigation.signOut')}</span>
                  </button>
                </>
              ) : (
                // Mode déconnecté : Connexion, FAQ, Tarifs
                <>
                  <Link
                    href={`/${locale}/login`}
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5"
                  >
                    <i className="pi pi-sign-in text-xs"></i>
                    <span>{t('auth.buttons.signIn')}</span>
                  </Link>
                  <a
                    href={`/${locale}#faq`}
                    onClick={handleFaqClick}
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="pi pi-question-circle text-xs"></i>
                    <span>{t('navigation.faq')}</span>
                  </a>
                  <Link
                    href={`/${locale}/pricing`}
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden md:inline-flex items-center gap-1.5"
                  >
                    <i className="pi pi-tag text-xs"></i>
                    <span>{t('navigation.pricing')}</span>
                  </Link>
                </>
              )
            }
          </div>
        </div>
      </div>
    </header>
  )
}
