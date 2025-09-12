'use client'

import { Button } from 'primereact/button'
import { Menu } from 'primereact/menu'
import { confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useRef, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, signOut, deleteAccount } = useAuth()
  const menuRef = useRef<Menu>(null)
  const toastRef = useRef<Toast>(null)
  const [loading, setLoading] = useState(false)

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      toastRef.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de se déconnecter',
        life: 3000
      })
    }
  }, [signOut])

  const handleDeleteAccount = useCallback(() => {
    confirmDialog({
      message: 'Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      header: 'Supprimer le compte',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Supprimer définitivement',
      rejectLabel: 'Annuler',
      accept: async () => {
        setLoading(true)
        try {
          const { error } = await deleteAccount()
          if (error) {
            console.error('Error deleting account:', error)
            toastRef.current?.show({
              severity: 'error',
              summary: 'Erreur',
              detail: typeof error === 'string' ? error : error.message || 'Impossible de supprimer le compte',
              life: 5000
            })
          } else {
            toastRef.current?.show({
              severity: 'success',
              summary: 'Succès',
              detail: 'Compte supprimé avec succès',
              life: 3000
            })
          }
        } catch (error) {
          console.error('Error deleting account:', error)
          toastRef.current?.show({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Une erreur inattendue s\'est produite',
            life: 5000
          })
        } finally {
          setLoading(false)
        }
      },
    })
  }, [deleteAccount])

  if (!user?.email) {
    return null
  }

  const menuItems = [
    {
      label: 'Se déconnecter',
      icon: 'pi pi-sign-out',
      command: handleSignOut,
      disabled: loading
    },
    {
      separator: true
    },
    {
      label: 'Supprimer le compte',
      icon: 'pi pi-trash',
      className: 'text-red-600',
      command: handleDeleteAccount,
      disabled: loading
    }
  ]

  return (
    <>
      <Toast ref={toastRef} />
      <Button
        icon="pi pi-user"
        className="p-button-text p-button-sm text-gray-500 hover:text-gray-700"
        onClick={(e) => menuRef.current?.toggle(e)}
        tooltip={`Menu utilisateur (${user.email})`}
        tooltipOptions={{ position: 'bottom' }}
        aria-label="Menu utilisateur"
        loading={loading}
        disabled={loading}
      />
      <Menu
        ref={menuRef}
        model={menuItems}
        popup
        className="w-48"
      />
    </>
  )
}
