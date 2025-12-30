'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'
import { Skeleton } from 'primereact/skeleton'
import { Toast } from 'primereact/toast'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SubscriptionManager } from '@/components/SubscriptionManager'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'

function AccountPageContent() {
  const { locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userPlan, loading, deleteAccount, refreshUserPlan, updateUserName } = useAuth()
  const t = useTranslations(locale as string)
  const toast = useRef<Toast>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // États pour l'édition du nom
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  // Initialiser le nom édité quand l'utilisateur change
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setEditedName(user.user_metadata.full_name)
    } else if (user?.email) {
      setEditedName(user.email.split('@')[0])
    }
  }, [user])

  const handleStartEditName = () => {
    setIsEditingName(true)
    setEditedName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditedName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: t('account.userInfo.editName.errors.empty'),
        life: 3000,
      })
      return
    }

    setIsUpdatingName(true)
    try {
      const { error } = await updateUserName(editedName.trim())

      if (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message,
          life: 4000,
        })
      } else {
        toast.current?.show({
          severity: 'success',
          summary: 'Succès',
          detail: t('account.userInfo.editName.success'),
          life: 3000,
        })
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Update name error:', error)
      toast.current?.show({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Une erreur est survenue lors de la mise à jour',
        life: 4000,
      })
    } finally {
      setIsUpdatingName(false)
    }
  }

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
            life: 2000, // Durée d'affichage du toast
          })
          // Redirection immédiate après suppression réussie
          router.push(`/${locale}`)
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

  // Gestion des paramètres d'URL (success/cancelled)
  useEffect(() => {
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')

    if (success === 'true' && user) {
      // 🎉 Paiement réussi
      toast.current?.show({
        severity: 'success',
        summary: t('account.payment.success.title'),
        detail: t('account.payment.success.message'),
        life: 5000,
      })

      // 🔄 Refresh du plan utilisateur pour s'assurer qu'il est à jour
      refreshUserPlan()

      // 🧹 Nettoyer l'URL après affichage
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      window.history.replaceState({}, '', url.toString())
    }

    if (cancelled === 'true' && user) {
      // ⚠️ Paiement annulé
      toast.current?.show({
        severity: 'info',
        summary: t('account.payment.cancelled.title'),
        detail: t('account.payment.cancelled.message'),
        life: 4000,
      })

      // 🧹 Nettoyer l'URL après affichage
      const url = new URL(window.location.href)
      url.searchParams.delete('cancelled')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, user, t, refreshUserPlan])

  // Redirection si pas d'utilisateur
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`)
    }
  }, [loading, user, router, locale])

  // Afficher un loader pendant la redirection ou si pas d'utilisateur
  if (!user) {
    return null
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
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="pi pi-user text-white text-3xl"></i>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('account.title')}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{t('account.description')}</p>
              </div>
            </div>

            {/* Status du compte et Gestion d'abonnement */}
            <Card className="mb-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {userPlan === 'premium'
                        ? t('subscription.title')
                        : t('account.planStatus.title')}
                    </h2>
                  </div>

                {/* Plan actuel */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    {loading ? (
                      /* Skeleton loader pour le plan */
                      <>
                        <div className="flex items-center gap-3">
                          <Skeleton shape="circle" size="2.5rem" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {t('account.planStatus.currentPlan')}
                            </h3>
                            <Skeleton width="6rem" height="1rem" className="mt-1" />
                          </div>
                        </div>
                        <div className="text-right">
                          <Skeleton width="5rem" height="1.5rem" borderRadius="9999px" />
                        </div>
                      </>
                    ) : (
                      /* Contenu réel */
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <i className="pi pi-star text-white text-lg"></i>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {t('account.planStatus.currentPlan')}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {userPlan === 'premium'
                                ? t('pricing.premium.title')
                                : t('account.planStatus.freePlan')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              userPlan === 'premium'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <i
                              className={`mr-2 ${userPlan === 'premium' ? 'pi pi-star' : 'pi pi-gift'}`}
                            ></i>
                            {userPlan === 'premium'
                              ? t('pricing.premium.title')
                              : t('pricing.plans.free.name')}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Call to action upgrade - uniquement pour les utilisateurs gratuits */}
                  {!loading && userPlan === 'free' && (
                    <div className="mt-6 pt-4 border-t border-blue-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 mb-2">
                            {t('account.planStatus.upgradePrompt')}
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li className="flex items-center gap-2">
                              <i className="pi pi-check text-green-500"></i>
                              {t('account.planStatus.premiumFeatures.unlimited')}
                            </li>
                            <li className="flex items-center gap-2">
                              <i className="pi pi-check text-green-500"></i>
                              {t('account.planStatus.premiumFeatures.priority')}
                            </li>
                            <li className="flex items-center gap-2">
                              <i className="pi pi-check text-green-500"></i>
                              {t('account.planStatus.premiumFeatures.support')}
                            </li>
                          </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            label={t('account.planStatus.upgradeToPremium')}
                            icon="pi pi-star"
                            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                            onClick={() => router.push(`/${locale}/pricing`)}
                            size="small"
                          />
                          <div className="text-xs text-center text-gray-500">
                            {t('account.planStatus.fromPrice')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Gestion des abonnements - intégrée pour les utilisateurs Premium */}
                  {userPlan === 'premium' && (
                    <div className="pt-6 border-t border-gray-200">
                      <SubscriptionManager t={t} embedded={true} />
                    </div>
                  )}
                </div>
              </Card>

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
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700">
                      {t('account.userInfo.fullName')}
                    </div>
                    {!isEditingName && (
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        severity="secondary"
                        onClick={handleStartEditName}
                        tooltip={t('account.userInfo.editName.tooltip')}
                        className="p-2"
                      />
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="space-y-3">
                      <InputText
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder={t('account.userInfo.editName.placeholder')}
                        className="w-full"
                        disabled={isUpdatingName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName()
                          } else if (e.key === 'Escape') {
                            handleCancelEditName()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          label={t('account.userInfo.editName.save')}
                          icon="pi pi-check"
                          size="small"
                          onClick={handleSaveName}
                          loading={isUpdatingName}
                          className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 border-0 shadow-md hover:shadow-lg transition-all duration-200"
                        />
                        <Button
                          label={t('account.userInfo.editName.cancel')}
                          icon="pi pi-times"
                          size="small"
                          severity="secondary"
                          outlined
                          onClick={handleCancelEditName}
                          disabled={isUpdatingName}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 text-lg">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.email')}
                  </div>
                  <p className="text-gray-900 text-lg">{user.email}</p>
                </div>

                {/* Date de création */}
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.memberSince')}
                  </div>
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

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  )
}
