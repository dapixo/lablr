'use client'

import { Calendar, CreditCard, Package } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { useCallback } from 'react'
import type { TranslationVariables } from '@/hooks/useTranslations'
import { getPluralVariables } from '@/lib/i18n-helpers'
import type { Subscription } from '@/types/subscription'

interface SubscriptionManagerProps {
  t: (key: string, variables?: TranslationVariables) => string
  subscription: Subscription
  portalUrl: string | null
  embedded?: boolean
}

/**
 * Composant de gestion des abonnements Dodo Payments
 * Composant purement présentationnel qui affiche les données reçues en props
 */
export function SubscriptionManager({
  t,
  subscription: subscriptionData,
  portalUrl,
  embedded = false,
}: SubscriptionManagerProps) {
  const { locale } = useParams()

  const openCustomerPortal = useCallback(() => {
    if (portalUrl) {
      window.open(portalUrl, '_blank', 'noopener,noreferrer')
    } else if (subscriptionData?.urls?.customer_portal) {
      window.open(subscriptionData.urls.customer_portal, '_blank', 'noopener,noreferrer')
    }
  }, [portalUrl, subscriptionData?.urls?.customer_portal])

  /**
   * Formatage des dates
   */
  const formatDate = useCallback(
    (dateString: string | null) => {
      if (!dateString) return 'N/A'
      const currentLocale = (locale as string) || 'fr'
      return new Date(dateString).toLocaleDateString(currentLocale === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
    [locale]
  )

  /**
   * Traduction du nom du plan
   */
  const getTranslatedPlanName = useCallback(
    (planName: string | null) => {
      if (!planName) return 'N/A'

      // Essayer de trouver une traduction pour le nom du plan
      const translationKey = `subscription.plans.${planName}`
      const translated = t(translationKey)

      // Si la traduction existe (différente de la clé), l'utiliser
      return translated !== translationKey ? translated : planName
    },
    [t]
  )

  /**
   * Traduction du format prix (ex: "/ mois", "/ month")
   */
  const getTranslatedPriceFormat = useCallback(
    (interval: string) => {
      if (!interval) return ''

      // Handle both English and French interval values
      const normalizedInterval = interval.toLowerCase()
      if (normalizedInterval === 'month' || normalizedInterval === 'mois') {
        return t('subscription.priceFormat.month')
      } else if (
        normalizedInterval === 'year' ||
        normalizedInterval === 'an' ||
        normalizedInterval === 'yearly' ||
        normalizedInterval === 'annual'
      ) {
        return t('subscription.priceFormat.year')
      } else {
        // Fallback to month format
        return t('subscription.priceFormat.month')
      }
    },
    [t]
  )

  /**
   * Obtention du tag de statut
   */
  const getStatusTag = useCallback(
    (subscription: Subscription) => {
      const status = subscription.status
      const isInGracePeriod = subscription.isInGracePeriod

      const statusConfig = {
        active: { severity: 'success', icon: 'pi pi-check-circle' },
        on_trial: { severity: 'info', icon: 'pi pi-clock' },
        paused: { severity: 'warning', icon: 'pi pi-pause' },
        cancelled: { severity: 'danger', icon: 'pi pi-times-circle' },
        expired: { severity: 'danger', icon: 'pi pi-ban' },
        past_due: {
          severity: isInGracePeriod ? 'info' : 'warning',
          icon: 'pi pi-exclamation-triangle',
        },
        unpaid: {
          severity: isInGracePeriod ? 'info' : 'danger',
          icon: 'pi pi-exclamation-triangle',
        },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || {
        severity: 'secondary',
        icon: 'pi pi-question',
      }

      // Affichage spécial pour période de grâce
      const displayValue = isInGracePeriod
        ? t('subscription.status.gracePeriod', {
            days: subscription.graceDaysRemaining ?? 0,
            ...(subscription.graceDaysRemaining
              ? getPluralVariables(subscription.graceDaysRemaining)
              : {}),
          })
        : (() => {
            // Essayer de traduire le status
            const statusKey = `subscription.statusLabels.${status}`
            const translatedStatus = t(statusKey)
            return translatedStatus !== statusKey
              ? translatedStatus
              : subscription.statusFormatted || status
          })()

      return (
        <Tag
          value={displayValue}
          severity={config.severity as 'success' | 'info' | 'warning' | 'danger' | 'secondary'}
          icon={config.icon}
          className="font-medium"
        />
      )
    },
    [t]
  )

  const subscriptionContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('subscription.details')}</h3>
        {subscriptionData && getStatusTag(subscriptionData)}
      </div>

      {subscriptionData && (
        <>
          {subscriptionData.isInGracePeriod && (
            <div
              className={`border rounded-lg p-4 ${
                subscriptionData.status === 'cancelled'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <i
                  className={`text-lg mt-0.5 ${
                    subscriptionData.status === 'cancelled'
                      ? 'pi pi-info-circle text-blue-500'
                      : 'pi pi-exclamation-triangle text-orange-500'
                  }`}
                ></i>
                <div className="flex-1">
                  <h4
                    className={`font-medium mb-1 ${
                      subscriptionData.status === 'cancelled' ? 'text-blue-900' : 'text-orange-900'
                    }`}
                  >
                    {subscriptionData.status === 'cancelled'
                      ? t('subscription.status.cancelled.title')
                      : t('subscription.status.paymentIssue.title')}
                  </h4>
                  <p
                    className={`text-sm mb-3 ${
                      subscriptionData.status === 'cancelled' ? 'text-blue-800' : 'text-orange-800'
                    }`}
                  >
                    {subscriptionData.status === 'cancelled'
                      ? t('subscription.status.cancelled.message', {
                          days: subscriptionData.graceDaysRemaining ?? 0,
                          ...(subscriptionData.graceDaysRemaining
                            ? getPluralVariables(subscriptionData.graceDaysRemaining)
                            : {}),
                        })
                      : t('subscription.status.paymentIssue.message', {
                          days: subscriptionData.graceDaysRemaining ?? 0,
                          ...(subscriptionData.graceDaysRemaining
                            ? getPluralVariables(subscriptionData.graceDaysRemaining)
                            : {}),
                        })}
                  </p>
                  <p
                    className={`text-sm ${
                      subscriptionData.status === 'cancelled' ? 'text-blue-700' : 'text-orange-700'
                    }`}
                  >
                    {subscriptionData.status === 'cancelled'
                      ? t('subscription.status.cancelled.action')
                      : t('subscription.status.paymentIssue.action', {
                          date: subscriptionData.gracePeriodEndsAt
                            ? formatDate(subscriptionData.gracePeriodEndsAt)
                            : '',
                        })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('subscription.plan')}</p>
                  <p className="text-gray-600">
                    {getTranslatedPlanName(subscriptionData.planName) ||
                      subscriptionData.statusFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('subscription.price')}</p>
                  <p className="text-gray-600">
                    €{subscriptionData.price}{' '}
                    {subscriptionData.isUsageBased
                      ? `/ ${t('subscription.usage')}`
                      : getTranslatedPriceFormat(subscriptionData.interval)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {subscriptionData.status === 'cancelled'
                      ? t('subscription.endsAt')
                      : subscriptionData.status === 'paused'
                        ? t('subscription.accessUntil')
                        : t('subscription.renewsAt')}
                  </p>
                  <p className="text-gray-600">
                    {formatDate(
                      subscriptionData.status === 'cancelled'
                        ? subscriptionData.endsAt
                        : subscriptionData.status === 'paused'
                          ? subscriptionData.endsAt || subscriptionData.renewsAt
                          : subscriptionData.renewsAt
                    )}
                  </p>
                </div>
              </div>

              {subscriptionData.cardBrand && subscriptionData.cardLastFour && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('subscription.paymentMethod')}
                    </p>
                    <p className="text-gray-600">
                      {subscriptionData.cardBrand.toUpperCase()} ••••{' '}
                      {subscriptionData.cardLastFour}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <Button
              label={t('subscription.manage')}
              icon="pi pi-external-link"
              onClick={openCustomerPortal}
              disabled={!portalUrl && !subscriptionData.urls?.customer_portal}
              outlined
              size="small"
            />
          </div>
        </>
      )}
    </div>
  )

  return embedded ? subscriptionContent : <Card className="mb-6">{subscriptionContent}</Card>
}
