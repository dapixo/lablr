'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AccountPageSkeleton } from '@/components/AccountPageSkeleton'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SubscriptionManager } from '@/components/SubscriptionManager'
import { useAccountData } from '@/hooks/useAccountData'
import { useAuth } from '@/hooks/useAuth'
import { useDodoCheckout } from '@/hooks/useDodoCheckout'
import { useTranslations } from '@/hooks/useTranslations'
import { debugLog } from '@/lib/debug'

function AccountPageContent() {
  const { locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, deleteAccount, updateUserName, refreshUserPlan } = useAuth()
  const t = useTranslations(locale as string)
  const toast = useRef<Toast>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { accountData, isLoading: accountLoading, refreshAccountData } = useAccountData(user?.id)
  const { clearPendingCheckout } = useDodoCheckout()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const paymentProcessedRef = useRef(false)

  const getUserDisplayName = useCallback(() => {
    return accountData?.user.fullName || accountData?.user.email?.split('@')[0] || ''
  }, [accountData])

  const cleanUrlParams = useCallback((param: string) => {
    const url = new URL(window.location.href)
    url.searchParams.delete(param)
    window.history.replaceState({}, '', url.toString())
  }, [])

  const showToast = useCallback(
    (severity: 'success' | 'info' | 'error', summary: string, detail: string, life = 3000) => {
      toast.current?.show({ severity, summary, detail, life })
    },
    []
  )

  useEffect(() => {
    if (accountData?.user.fullName) {
      setEditedName(accountData.user.fullName)
    } else if (accountData?.user.email) {
      setEditedName(accountData.user.email.split('@')[0])
    }
  }, [accountData])

  const handleStartEditName = useCallback(() => {
    setIsEditingName(true)
    setEditedName(getUserDisplayName())
  }, [getUserDisplayName])

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false)
    setEditedName(getUserDisplayName())
  }, [getUserDisplayName])

  const handleSaveName = useCallback(async () => {
    if (!editedName.trim()) {
      showToast('error', 'Erreur', t('account.userInfo.editName.errors.empty'))
      return
    }

    setIsUpdatingName(true)
    try {
      const { error } = await updateUserName(editedName.trim())

      if (error) {
        showToast('error', 'Erreur', error.message, 4000)
      } else {
        showToast('success', 'Succès', t('account.userInfo.editName.success'))
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Update name error:', error)
      showToast('error', 'Erreur', 'Une erreur est survenue lors de la mise à jour', 4000)
    } finally {
      setIsUpdatingName(false)
    }
  }, [editedName, showToast, t, updateUserName])

  const handleDeleteAccount = useCallback(() => {
    confirmDialog({
      message: t('userMenu.confirmDelete.message'),
      header: t('userMenu.confirmDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        setIsDeleting(true)
        try {
          await deleteAccount()
          showToast(
            'success',
            t('userMenu.toast.deleteSuccess.summary'),
            t('userMenu.toast.deleteSuccess.detail'),
            2000
          )
          router.push(`/${locale}`)
        } catch (error) {
          console.error('Delete account error:', error)
          showToast(
            'error',
            t('userMenu.toast.deleteError.summary'),
            t('userMenu.toast.deleteError.detail')
          )
        } finally {
          setIsDeleting(false)
        }
      },
      acceptLabel: t('userMenu.confirmDelete.accept'),
      rejectLabel: t('userMenu.confirmDelete.reject'),
    })
  }, [deleteAccount, locale, router, showToast, t])

  // Étape 1: Détecter le succès/annulation dans l'URL et stocker dans sessionStorage
  useEffect(() => {
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    // Dodo Payments envoie status=active et subscription_id après paiement réussi
    const status = searchParams.get('status')
    const subscriptionId = searchParams.get('subscription_id')

    // Paiement réussi (ancien format success=true OU nouveau format Dodo status=active)
    const isPaymentSuccess = success === 'true' || (status === 'active' && subscriptionId)

    if (isPaymentSuccess) {
      debugLog('[Account] Payment success detected in URL, storing in sessionStorage')
      sessionStorage.setItem('payment_success', 'true')
      clearPendingCheckout()

      // Nettoyer les params de l'URL immédiatement
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('status')
      url.searchParams.delete('subscription_id')
      window.history.replaceState({}, '', url.toString())
    }

    if (cancelled === 'true') {
      debugLog('[Account] Payment cancelled detected in URL, storing in sessionStorage')
      sessionStorage.setItem('payment_cancelled', 'true')
      clearPendingCheckout()
      cleanUrlParams('cancelled')
    }
  }, [searchParams, clearPendingCheckout, cleanUrlParams])

  // Étape 2: Afficher le toast une fois les données chargées
  useEffect(() => {
    // Attendre que tout soit chargé
    if (loading || accountLoading || !accountData || !user) return
    if (paymentProcessedRef.current) return

    const paymentSuccess = sessionStorage.getItem('payment_success')
    const paymentCancelled = sessionStorage.getItem('payment_cancelled')

    if (paymentSuccess) {
      paymentProcessedRef.current = true
      sessionStorage.removeItem('payment_success')
      debugLog('[Account] Showing payment success toast')

      // Petit délai pour s'assurer que le Toast est bien monté
      setTimeout(() => {
        showToast(
          'success',
          t('account.payment.success.title'),
          t('account.payment.success.message'),
          6000
        )
        // Rafraîchir les données en background
        refreshAccountData()
        refreshUserPlan()
      }, 300)
    }

    if (paymentCancelled && !paymentProcessedRef.current) {
      paymentProcessedRef.current = true
      sessionStorage.removeItem('payment_cancelled')
      debugLog('[Account] Showing payment cancelled toast')

      setTimeout(() => {
        showToast(
          'info',
          t('account.payment.cancelled.title'),
          t('account.payment.cancelled.message'),
          4000
        )
      }, 300)
    }
  }, [loading, accountLoading, accountData, user, t, showToast, refreshAccountData, refreshUserPlan])

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`)
    }
  }, [loading, user, router, locale])

  if (loading || accountLoading || !accountData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header t={t} />
        <main className="flex-1 bg-gray-50">
          <AccountPageSkeleton />
        </main>
        <Footer t={t} />
        {/* Toast toujours monté pour recevoir les notifications de paiement */}
        <Toast ref={toast} />
      </div>
    )
  }

  const { plan: userPlan, subscription, portalUrl, user: accountUser } = accountData

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

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
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
                  </div>

                  {userPlan === 'free' && (
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

                {userPlan === 'premium' && subscription && (
                  <div className="pt-6 border-t border-gray-200">
                    <SubscriptionManager
                      t={t}
                      subscription={subscription}
                      portalUrl={portalUrl}
                      embedded={true}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className="mb-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {t('account.userInfo.title')}
                    </h2>
                  </div>
                </div>

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
                    <p className="text-gray-900 text-lg">{getUserDisplayName() || 'N/A'}</p>
                  )}
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.email')}
                  </div>
                  <p className="text-gray-900 text-lg">{accountUser.email}</p>
                </div>

                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account.userInfo.memberSince')}
                  </div>
                  <p className="text-gray-600">
                    {new Date(accountUser.createdAt).toLocaleDateString(locale as string, {
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
