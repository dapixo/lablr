'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'
import { UserMenu } from '@/components/auth/UserMenu'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  t: (key: string) => string
}

export const Header: React.FC<HeaderProps> = ({ t }) => {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const { user, loading } = useAuth()

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Left Section - Brand */}
          <Link href={`/${locale}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <i className="pi pi-tag text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {t('brand.name')}
              </h1>
              <p className="text-sm text-gray-600 font-medium">{t('brand.tagline')}</p>
            </div>
          </Link>

          {/* Center Section - Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Navigation items can be added here if needed */}
          </nav>

          {/* Right Section - User Menu + Language Selector */}
          <div className="flex items-center gap-3">
            {!loading && user ? <UserMenu /> : null}
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  )
}