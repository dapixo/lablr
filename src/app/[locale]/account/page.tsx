'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Skeleton } from 'primereact/skeleton'
import { Toast } from 'primereact/toast'
import { useEffect, useRef, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'
import { useUsageTracking } from '@/hooks/useUsageTracking'
import { getPluralVariables } from '@/lib/i18n-helpers'

export default function AccountPage() {
  const { locale } = useParams()
  const router = useRouter()
  const { user, userPlan, loading: authLoading, deleteAccount } = useAuth()
  const t = useTranslations(locale as string)
  const toast = useRef<Toast>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { labelsUsed, remainingLabels, loading: usageLoading } = useUsageTracking()

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

  // Redirection si pas d'utilisateur
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`)
    }
  }, [authLoading, user, router, locale])

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
                <i className="pi pi-user text-6xl text-blue-500 mb-4 block"></i>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('account.title')}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{t('account.description')}</p>
              </div>
            </div>

            {/* Status du compte */}
            <Card className="mb-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('account.planStatus.title')}
                  </h2>
                </div>

                {/* Plan actuel */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    {authLoading ? (
                      /* Skeleton loader pour le plan */
                      <>
                        <div className="flex items-center gap-3">
                          <Skeleton shape="circle" size="2.5rem" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{t('account.planStatus.currentPlan')}</h3>
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
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <i className="pi pi-star text-white text-lg"></i>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{t('account.planStatus.currentPlan')}</h3>
                            <p className="text-sm text-gray-600">
                              {userPlan === 'premium'
                                ? t('pricing.premium.title')
                                : t('account.planStatus.freePlan')
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            userPlan === 'premium'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            <i className={`mr-2 ${userPlan === 'premium' ? 'pi pi-star' : 'pi pi-gift'}`}></i>
                            {userPlan === 'premium'
                              ? t('pricing.premium.title')
                              : t('pricing.plans.free.name')
                            }
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Usage quotidien */}
                  <div className="space-y-3">
                    {authLoading || usageLoading ? (
                      /* Skeleton loader global */
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <Skeleton width="8rem" height="1rem" />
                          <Skeleton width="6rem" height="1rem" />
                        </div>
                        <div className="w-full">
                          <Skeleton width="100%" height="0.5rem" borderRadius="9999px" />
                        </div>
                        <Skeleton width="10rem" height="1rem" />
                      </>
                    ) : userPlan === 'premium' ? (
                      /* Utilisateur Premium */
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                          <i className="pi pi-infinity text-xl"></i>
                          <span className="text-lg">{t('account.planStatus.premiumStatus.unlimitedLabels')}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {t('account.planStatus.premiumStatus.description')}
                        </p>
                      </div>
                    ) : (
                      /* Contenu réel pour utilisateurs gratuits */
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{t('account.planStatus.dailyUsage')}</span>
                          <span className="font-medium text-gray-900">
                            {labelsUsed}/10 {t('account.planStatus.labelsUsed')}
                          </span>
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              remainingLabels === 0 ? 'bg-red-500' :
                              remainingLabels <= 3 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(labelsUsed / 10) * 100}%` }}
                          ></div>
                        </div>

                        <div className="text-sm text-gray-600">
                          {remainingLabels > 0 ? (
                            <span>{t('account.planStatus.remainingLabels', getPluralVariables(remainingLabels))}</span>
                          ) : (
                            <span className="text-red-600 font-medium">{t('account.planStatus.limitReached')}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Call to action upgrade - uniquement pour les utilisateurs gratuits */}
                  {!authLoading && userPlan === 'free' && (
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
                          className="p-button-success"
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
