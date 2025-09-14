'use client'

import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Menu } from 'primereact/menu'
import { Toast } from 'primereact/toast'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [locale, setLocale] = useState('fr')
  const t = useTranslations(locale)
  const menuRef = useRef<Menu>(null)
  const toastRef = useRef<Toast>(null)
  const [loading, _setLoading] = useState(false)

  // Récupérer le locale depuis l'URL et écouter les changements
  useEffect(() => {
    const updateLocale = () => {
      if (typeof window !== 'undefined') {
        const pathLocale = window.location.pathname.split('/')[1]
        if (pathLocale === 'en' || pathLocale === 'fr') {
          setLocale(pathLocale)
        }
      }
    }

    updateLocale()

    // Écouter les changements d'URL
    window.addEventListener('popstate', updateLocale)
    return () => window.removeEventListener('popstate', updateLocale)
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      toastRef.current?.show({
        severity: 'error',
        summary: t('userMenu.toast.signOutError.summary'),
        detail: t('userMenu.toast.signOutError.detail'),
        life: 3000,
      })
    }
  }, [signOut, t])

  const handleAccountClick = useCallback(() => {
    router.push(`/${locale}/account`)
  }, [router, locale])

  if (!user?.email) {
    return null
  }

  const menuItems = [
    {
      label: t('userMenu.account'),
      icon: 'pi pi-user',
      command: handleAccountClick,
      disabled: loading,
    },
    {
      separator: true,
    },
    {
      label: t('userMenu.signOut'),
      icon: 'pi pi-sign-out',
      command: handleSignOut,
      disabled: loading,
    },
  ]

  return (
    <>
      <Toast ref={toastRef} />
      <Button
        icon="pi pi-user"
        className="p-button-text p-button-sm text-gray-500 hover:text-gray-700"
        onClick={(e) => menuRef.current?.toggle(e)}
        tooltip={t('userMenu.tooltip').replace('{email}', user.email)}
        tooltipOptions={{ position: 'bottom' }}
        aria-label={t('userMenu.ariaLabel')}
        loading={loading}
        disabled={loading}
      />
      <Menu ref={menuRef} model={menuItems} popup className="w-48" />
    </>
  )
}
