'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useRef, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'

export default function AccountPage() {
  const { locale } = useParams()
  const router = useRouter()
  const { user, deleteAccount } = useAuth()
  const t = useTranslations(locale as string)
  const toast = useRef<Toast>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = () => {
    confirmDialog({
      message: t('userMenu.confirmDelete.message'),
      header: t('userMenu.confirmDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        setIsDeleting(true)
        try {
          await deleteAccount()
          toast.current?.show({
            severity: 'success',
            summary: t('userMenu.toast.deleteSuccess.summary'),
            detail: t('userMenu.toast.deleteSuccess.detail'),
          })
          // Redirection vers la page d'accueil après suppression
          setTimeout(() => {
            router.push(`/${locale}`)
          }, 1500)
        } catch (error) {
          console.error('Delete account error:', error)
          toast.current?.show({
            severity: 'error',
            summary: t('userMenu.toast.deleteError.summary'),
            detail: t('userMenu.toast.deleteError.detail'),
          })
        } finally {
          setIsDeleting(false)
        }
      },
      reject: () => {
        // L'utilisateur a annulé
      },
      acceptLabel: t('userMenu.confirmDelete.accept'),
      rejectLabel: t('userMenu.confirmDelete.reject'),
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header t={t} />
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
            <p className="text-gray-600">{t('status.processing')}</p>
          </div>
        </div>
        <Footer t={t} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header t={t} />

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
              <div className="mb-6">
                <i className="pi pi-user text-6xl text-blue-500 mb-4 block"></i>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('account.title')}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{t('account.description')}</p>
              </div>
            </div>

            {/* Informations utilisateur */}
            <Card className="mb-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {t('account.userInfo.title')}
                    </h2>
                  </div>
                </div>

                {/* Nom complet */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.fullName')}
                  </label>
                  <p className="text-gray-900 text-lg">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'N/A'}
                  </p>
                </div>

                {/* Email */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.email')}
                  </label>
                  <p className="text-gray-900 text-lg">{user.email}</p>
                </div>

                {/* Date de création */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.memberSince')}
                  </label>
                  <p className="text-gray-600">
                    {new Date(user.created_at).toLocaleDateString(locale as string, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Zone de danger */}
            <Card className="border-red-200 bg-red-50">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-red-900 mb-2">
                    {t('account.dangerZone.title')}
                  </h2>
                  <p className="text-red-700 text-sm">{t('account.dangerZone.description')}</p>
                </div>

                <div className="pt-4 border-t border-red-200">
                  <Button
                    label={t('account.dangerZone.deleteAccount')}
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    onClick={handleDeleteAccount}
                    loading={isDeleting}
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer t={t} />

      {/* Dialogs */}
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  )
}
