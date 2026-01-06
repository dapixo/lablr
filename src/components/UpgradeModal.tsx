'use client'

import { Check, Crown, Zap } from 'lucide-react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { useDodoCheckout } from '@/hooks/useDodoCheckout'
import type { TranslationVariables } from '@/hooks/useTranslations'
import { getPluralVariables } from '@/lib/i18n-helpers'

interface UpgradeModalProps {
  visible: boolean
  onHide: () => void
  onPrintLimited: () => void
  t: (key: string, variables?: TranslationVariables) => string
  totalAddresses: number
  printLimit: number
}

/**
 * Modal d'upgrade lorsque l'utilisateur dépasse la limite de 5 étiquettes par impression
 */
export function UpgradeModal({
  visible,
  onHide,
  onPrintLimited,
  t,
  totalAddresses,
  printLimit,
}: UpgradeModalProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const { user, userPlan } = useAuth()
  const {
    createCheckout,
    isLoading: isUpgrading,
    error: checkoutError,
    clearError,
  } = useDodoCheckout()
  const { trackUpgradeAttempt } = useAnalytics()
  const toast = useRef<Toast>(null)

  /**
   * Ferme la modal et clear les erreurs
   */
  const handleClose = useCallback(() => {
    clearError()
    onHide()
  }, [onHide, clearError])

  /**
   * Gère l'upgrade vers Premium via Dodo Payments
   */
  const handleUpgradeToPremium = useCallback(async () => {
    if (!user) {
      toast.current?.show({
        severity: 'warn',
        summary: t('auth.required.title'),
        detail: t('auth.required.message'),
        life: 3000,
      })
      return
    }

    if (userPlan === 'premium') {
      toast.current?.show({
        severity: 'info',
        summary: t('pricing.upgrade.alreadyPremium.title'),
        detail: t('pricing.upgrade.alreadyPremium.message'),
        life: 3000,
      })
      return
    }

    // Track tentative d'upgrade
    trackUpgradeAttempt({
      source: 'limit_modal',
      triggeredBy: 'limit_exceeded',
    })

    // Créer le checkout Dodo Payments
    const success = await createCheckout(isAnnual ? 'yearly' : 'monthly')

    if (success) {
      // Informer l'utilisateur qu'il va être redirigé
      toast.current?.show({
        severity: 'info',
        summary: t('pricing.checkout.redirecting.title'),
        detail: t('pricing.checkout.redirecting.message'),
        life: 3000,
      })
    }
  }, [user, userPlan, createCheckout, isAnnual, t, trackUpgradeAttempt])

  // Afficher les erreurs de checkout
  useEffect(() => {
    if (checkoutError) {
      toast.current?.show({
        severity: 'error',
        summary: t('pricing.checkout.error.title'),
        detail: checkoutError,
        life: 5000,
      })
    }
  }, [checkoutError, t])

  const headerContent = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold text-gray-900">{t('upgrade.title')}</span>
          <p className="text-sm text-gray-500 mt-1">{t('upgrade.subtitle')}</p>
        </div>
      </div>
    ),
    [t]
  )

  const premiumFeatures = useMemo(
    () => [
      t('pricing.premium.features.0'), // Étiquettes illimitées
      t('pricing.premium.features.1'), // Tous formats
      t('pricing.premium.features.2'), // Import toutes plateformes
      t('pricing.premium.features.3'), // Support prioritaire
    ],
    [t]
  )

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={headerContent}
      className="w-full max-w-2xl"
      modal
      draggable={false}
      resizable={false}
    >
      {/* Situation actuelle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2 text-blue-700">
              {t('upgrade.message.addressesDetected', getPluralVariables(totalAddresses))}
            </h3>
            <p className="text-sm text-gray-700">
              {t('upgrade.message.freeLimit', { limit: printLimit })}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Premium */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">{t('pricing.premium.title')}</h3>
            {isAnnual && (
              <Tag value="-33%" rounded severity="success" className="ml-2 font-bold shadow-sm" />
            )}
          </div>

          {/* Toggle mensuel/annuel */}
          <div className="inline-flex items-center bg-white rounded-full p-1 gap-1 relative mb-4 border">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                !isAnnual
                  ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.page.billingToggle.monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                isAnnual
                  ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.page.billingToggle.annually')}
            </button>
          </div>

          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-4xl font-bold text-blue-600">{isAnnual ? '€4' : '€6'}</span>
            <span className="text-gray-600">
              {isAnnual ? t('pricing.premium.periodAnnualBilling') : t('pricing.premium.perMonth')}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleUpgradeToPremium}
            loading={isUpgrading}
            className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 justify-center"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t('pricing.premium.cta')}
          </Button>
        </div>
      </div>

      <Divider align="center" className="my-6">
        <span className="text-xs text-gray-400 bg-white px-3">{t('common.or')}</span>
      </Divider>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          label={t('common.cancel')}
          icon="pi pi-times"
          onClick={onHide}
          outlined
          className="flex-1"
        />
        <Button
          label={t('upgrade.button.printLimited', { limit: printLimit })}
          icon="pi pi-print"
          onClick={() => {
            onPrintLimited()
            onHide()
          }}
          className="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white font-medium border-0"
        />
      </div>

      {/* Toast pour les notifications */}
      <Toast ref={toast} />
    </Dialog>
  )
}
