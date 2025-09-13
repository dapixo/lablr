'use client'

import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { Menu } from 'primereact/menu'
import { Toast } from 'primereact/toast'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'

export function UserMenu() {
  const { user, signOut, deleteAccount } = useAuth()
  const [locale, setLocale] = useState('fr')
  const t = useTranslations(locale)
  const menuRef = useRef<Menu>(null)
  const toastRef = useRef<Toast>(null)
  const [loading, setLoading] = useState(false)

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

  const handleDeleteAccount = useCallback(() => {
    confirmDialog({
      message: t('userMenu.confirmDelete.message'),
      header: t('userMenu.confirmDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('userMenu.confirmDelete.accept'),
      rejectLabel: t('userMenu.confirmDelete.reject'),
      accept: async () => {
        setLoading(true)
        try {
          const { error } = await deleteAccount()
          if (error) {
            console.error('Error deleting account:', error)
            toastRef.current?.show({
              severity: 'error',
              summary: t('userMenu.toast.deleteError.summary'),
              detail:
                typeof error === 'string'
                  ? error
                  : error.message || t('userMenu.toast.deleteError.detail'),
              life: 5000,
            })
          } else {
            toastRef.current?.show({
              severity: 'success',
              summary: t('userMenu.toast.deleteSuccess.summary'),
              detail: t('userMenu.toast.deleteSuccess.detail'),
              life: 3000,
            })
          }
        } catch (error) {
          console.error('Error deleting account:', error)
          toastRef.current?.show({
            severity: 'error',
            summary: t('userMenu.toast.unexpectedError.summary'),
            detail: t('userMenu.toast.unexpectedError.detail'),
            life: 5000,
          })
        } finally {
          setLoading(false)
        }
      },
    })
  }, [deleteAccount, t])

  if (!user?.email) {
    return null
  }

  const menuItems = [
    {
      label: t('userMenu.signOut'),
      icon: 'pi pi-sign-out',
      command: handleSignOut,
      disabled: loading,
    },
    {
      separator: true,
    },
    {
      label: t('userMenu.deleteAccount'),
      icon: 'pi pi-trash',
      className: 'text-red-600',
      command: handleDeleteAccount,
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
