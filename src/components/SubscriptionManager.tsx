'use client'

import { Calendar, CreditCard, Package } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'
import { Tag } from 'primereact/tag'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import type { TranslationVariables } from '@/hooks/useTranslations'
import { getPluralVariables } from '@/lib/i18n-helpers'
import type { Subscription } from '@/types/subscription'

interface SubscriptionManagerProps {
  t: (key: string, variables?: TranslationVariables) => string
  embedded?: boolean // Si true, ne génère pas la Card wrapper
}

/**
 * Composant de gestion des abonnements Dodo Payments
 */
export function SubscriptionManager({ t, embedded = false }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false) // useRef pour éviter re-renders inutiles
  const [loadingPortal, setLoadingPortal] = useState(false)
  const { locale } = useParams()
  const { user, userPlan } = useAuth()
  const { csrfFetch, loading: csrfLoading } = useCsrfToken()

  /**
   * Génération du lien du portail client Dodo Payments
   */
  const fetchPortalUrl = useCallback(async () => {
    if (!user || csrfLoading) return

    setLoadingPortal(true)

    try {
      const response = await csrfFetch('/api/dodopayments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Pas de subscription active, c'est normal
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Mettre à jour le subscription avec le portal URL
      setSubscription((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          urls: {
            ...prev.urls,
            customer_portal: data.portalUrl,
          },
        }
      })
    } catch (err) {
      console.error('Fetch portal URL error:', err)
      // Ne pas afficher d'erreur à l'utilisateur, juste logger
    } finally {
      setLoadingPortal(false)
    }
  }, [user, csrfFetch, csrfLoading])

  /**
   * Récupération des données d'abonnement depuis la base de données
   */
  const fetchSubscription = useCallback(async () => {
    if (!user || hasFetchedRef.current) return // Ne pas refaire l'appel si déjà fait

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Pas d'abonnement trouvé, c'est normal pour les utilisateurs free
          setSubscription(null)
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setSubscription(data.subscription)

      // Si l'utilisateur a un abonnement actif, générer le lien du portail
      if (data.subscription?.status === 'active') {
        fetchPortalUrl()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Fetch subscription error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
      hasFetchedRef.current = true // Marquer comme récupéré avec useRef
    }
  }, [user, fetchPortalUrl]) // Dépendances correctes maintenant

  useEffect(() => {
    hasFetchedRef.current = false // Reset cache quand l'utilisateur change
    fetchSubscription()
  }, [user, fetchSubscription]) // Dépendances correctes avec useRef

  /**
   * Ouverture du customer portal Dodo Payments
   */
  const openCustomerPortal = useCallback(() => {
    if (subscription?.urls?.customer_portal) {
      window.open(subscription.urls.customer_portal, '_blank', 'noopener,noreferrer')
    }
  }, [subscription])

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

  if (loading) {
    const loadingContent = (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="12rem" height="1.5rem" />
          <Skeleton width="5rem" height="2rem" borderRadius="1rem" />
        </div>
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="80%" height="1rem" />
        <div className="flex gap-3">
          <Skeleton width="8rem" height="2.5rem" borderRadius="0.5rem" />
          <Skeleton width="8rem" height="2.5rem" borderRadius="0.5rem" />
        </div>
      </div>
    )

    return embedded ? loadingContent : <Card className="mb-6">{loadingContent}</Card>
  }

  if (error) {
    const errorContent = (
      <div className="text-center py-6">
        <i className="pi pi-exclamation-triangle text-red-500 text-3xl mb-3 block"></i>
        <p className="text-red-700 mb-4">{t('subscription.error.loading')}</p>
        <Button
          label={t('common.retry')}
          icon="pi pi-refresh"
          onClick={() => {
            hasFetchedRef.current = false
            fetchSubscription()
          }}
          size="small"
          outlined
        />
      </div>
    )

    return embedded ? (
      <div className="border-red-200 bg-red-50 rounded-lg p-4">{errorContent}</div>
    ) : (
      <Card className="mb-6 border-red-200 bg-red-50">{errorContent}</Card>
    )
  }

  // Utilisateur Free sans abonnement - ne pas afficher car géré par la page Account
  if (!subscription && userPlan === 'free') {
    return null
  }

  // Utilisateur Premium avec abonnement
  const subscriptionContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('subscription.details')}</h3>
        {subscription && getStatusTag(subscription)}
      </div>

      {subscription && (
        <>
          {/* Alerte période de grâce */}
          {subscription.isInGracePeriod && (
            <div
              className={`border rounded-lg p-4 ${
                subscription.status === 'cancelled'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <i
                  className={`text-lg mt-0.5 ${
                    subscription.status === 'cancelled'
                      ? 'pi pi-info-circle text-blue-500'
                      : 'pi pi-exclamation-triangle text-orange-500'
                  }`}
                ></i>
                <div className="flex-1">
                  <h4
                    className={`font-medium mb-1 ${
                      subscription.status === 'cancelled' ? 'text-blue-900' : 'text-orange-900'
                    }`}
                  >
                    {subscription.status === 'cancelled'
                      ? t('subscription.status.cancelled.title')
                      : t('subscription.status.paymentIssue.title')}
                  </h4>
                  <p
                    className={`text-sm mb-3 ${
                      subscription.status === 'cancelled' ? 'text-blue-800' : 'text-orange-800'
                    }`}
                  >
                    {subscription.status === 'cancelled'
                      ? t('subscription.status.cancelled.message', {
                          days: subscription.graceDaysRemaining ?? 0,
                          ...(subscription.graceDaysRemaining
                            ? getPluralVariables(subscription.graceDaysRemaining)
                            : {}),
                        })
                      : t('subscription.status.paymentIssue.message', {
                          days: subscription.graceDaysRemaining ?? 0,
                          ...(subscription.graceDaysRemaining
                            ? getPluralVariables(subscription.graceDaysRemaining)
                            : {}),
                        })}
                  </p>
                  <p
                    className={`text-sm ${
                      subscription.status === 'cancelled' ? 'text-blue-700' : 'text-orange-700'
                    }`}
                  >
                    {subscription.status === 'cancelled'
                      ? t('subscription.status.cancelled.action')
                      : t('subscription.status.paymentIssue.action', {
                          date: subscription.gracePeriodEndsAt
                            ? formatDate(subscription.gracePeriodEndsAt)
                            : '',
                        })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('subscription.plan')}</p>
                  <p className="text-gray-600">
                    {getTranslatedPlanName(subscription.planName) || subscription.statusFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('subscription.price')}</p>
                  <p className="text-gray-600">
                    €{subscription.price}{' '}
                    {subscription.isUsageBased
                      ? `/ ${t('subscription.usage')}`
                      : getTranslatedPriceFormat(subscription.interval)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {subscription.status === 'cancelled'
                      ? t('subscription.endsAt')
                      : subscription.status === 'paused'
                      ? t('subscription.accessUntil')
                      : t('subscription.renewsAt')}
                  </p>
                  <p className="text-gray-600">
                    {formatDate(
                      subscription.status === 'cancelled'
                        ? subscription.endsAt
                        : subscription.status === 'paused'
                        ? subscription.endsAt || subscription.renewsAt
                        : subscription.renewsAt
                    )}
                  </p>
                </div>
              </div>

              {subscription.cardBrand && subscription.cardLastFour && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('subscription.paymentMethod')}
                    </p>
                    <p className="text-gray-600">
                      {subscription.cardBrand.toUpperCase()} •••• {subscription.cardLastFour}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <Button
              label={t('subscription.manage')}
              icon={loadingPortal ? 'pi pi-spin pi-spinner' : 'pi pi-external-link'}
              onClick={openCustomerPortal}
              disabled={!subscription.urls?.customer_portal || loadingPortal}
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
