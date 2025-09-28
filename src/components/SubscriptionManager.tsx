'use client'

import { Calendar, CreditCard, ExternalLink, Package } from 'lucide-react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'
import { Tag } from 'primereact/tag'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { LemonSqueezySubscription } from '@/types/lemonsqueezy'

interface SubscriptionManagerProps {
  t: (key: string, variables?: any) => string
  embedded?: boolean // Si true, ne génère pas la Card wrapper
}

/**
 * Composant de gestion des abonnements Lemon Squeezy
 */
export function SubscriptionManager({ t, embedded = false }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<LemonSqueezySubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false) // Cache pour éviter les appels répétitifs
  const { user, userPlan } = useAuth()

  /**
   * Récupération des données d'abonnement depuis la base de données
   */
  const fetchSubscription = useCallback(async () => {
    if (!user || hasFetched) return // Ne pas refaire l'appel si déjà fait

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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Fetch subscription error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
      setHasFetched(true) // Marquer comme récupéré
    }
  }, [user, hasFetched])

  useEffect(() => {
    setHasFetched(false) // Reset cache quand l'utilisateur change
    fetchSubscription()
  }, [user]) // Seulement se déclencher quand l'utilisateur change, pas à chaque render

  /**
   * Ouverture du customer portal Lemon Squeezy
   */
  const openCustomerPortal = useCallback(() => {
    if (subscription?.urls?.customer_portal) {
      window.open(subscription.urls.customer_portal, '_blank', 'noopener,noreferrer')
    }
  }, [subscription])

  /**
   * Formatage des dates
   */
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  /**
   * Obtention du tag de statut
   */
  const getStatusTag = useCallback((subscription: LemonSqueezySubscription) => {
    const status = subscription.status
    const isInGracePeriod = subscription.isInGracePeriod

    const statusConfig = {
      active: { severity: 'success', icon: 'pi pi-check-circle' },
      on_trial: { severity: 'info', icon: 'pi pi-clock' },
      paused: { severity: 'warning', icon: 'pi pi-pause' },
      cancelled: { severity: 'danger', icon: 'pi pi-times-circle' },
      expired: { severity: 'danger', icon: 'pi pi-ban' },
      past_due: { severity: isInGracePeriod ? 'info' : 'warning', icon: 'pi pi-exclamation-triangle' },
      unpaid: { severity: isInGracePeriod ? 'info' : 'danger', icon: 'pi pi-exclamation-triangle' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] ||
                  { severity: 'secondary', icon: 'pi pi-question' }

    // Affichage spécial pour période de grâce
    const displayValue = isInGracePeriod
      ? `Période de grâce (${subscription.graceDaysRemaining}j restant${subscription.graceDaysRemaining! > 1 ? 's' : ''})`
      : subscription.statusFormatted || status

    return (
      <Tag
        value={displayValue}
        severity={config.severity as any}
        icon={config.icon}
        className="font-medium"
      />
    )
  }, [])

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

    return embedded ? loadingContent : (
      <Card className="mb-6">
        {loadingContent}
      </Card>
    )
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
            setHasFetched(false)
            fetchSubscription()
          }}
          size="small"
          outlined
        />
      </div>
    )

    return embedded ? (
      <div className="border-red-200 bg-red-50 rounded-lg p-4">
        {errorContent}
      </div>
    ) : (
      <Card className="mb-6 border-red-200 bg-red-50">
        {errorContent}
      </Card>
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
        <h3 className="text-lg font-semibold text-gray-900">
          {t('subscription.details')}
        </h3>
        {subscription && getStatusTag(subscription)}
      </div>

      {subscription && (
        <>
          {/* Alerte période de grâce */}
          {subscription.isInGracePeriod && (
            <div className={`border rounded-lg p-4 ${
              subscription.status === 'cancelled'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-start gap-3">
                <i className={`text-lg mt-0.5 ${
                  subscription.status === 'cancelled'
                    ? 'pi pi-info-circle text-blue-500'
                    : 'pi pi-exclamation-triangle text-orange-500'
                }`}></i>
                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${
                    subscription.status === 'cancelled'
                      ? 'text-blue-900'
                      : 'text-orange-900'
                  }`}>
                    {subscription.status === 'cancelled'
                      ? 'Abonnement annulé'
                      : 'Problème de paiement détecté'
                    }
                  </h4>
                  <p className={`text-sm mb-3 ${
                    subscription.status === 'cancelled'
                      ? 'text-blue-800'
                      : 'text-orange-800'
                  }`}>
                    {subscription.status === 'cancelled' ? (
                      <>
                        Votre abonnement a été annulé, mais vous conservez l'accès Premium
                        jusqu'à la fin de votre période payée (<strong>{subscription.graceDaysRemaining} jour{subscription.graceDaysRemaining! > 1 ? 's' : ''} restant{subscription.graceDaysRemaining! > 1 ? 's' : ''}</strong>).
                      </>
                    ) : (
                      <>
                        Votre abonnement a rencontré un problème de paiement, mais vous conservez l'accès Premium
                        pendant encore <strong>{subscription.graceDaysRemaining} jour{subscription.graceDaysRemaining! > 1 ? 's' : ''}</strong>.
                      </>
                    )}
                  </p>
                  <p className={`text-sm ${
                    subscription.status === 'cancelled'
                      ? 'text-blue-700'
                      : 'text-orange-700'
                  }`}>
                    {subscription.status === 'cancelled' ? (
                      <>
                        Vous pouvez reprendre votre abonnement à tout moment via le portail client.
                      </>
                    ) : (
                      <>
                        Pour éviter toute interruption, veuillez mettre à jour votre méthode de paiement
                        avant le{' '}
                        <strong>
                          {subscription.gracePeriodEndsAt &&
                            new Date(subscription.gracePeriodEndsAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          }
                        </strong>.
                      </>
                    )}
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
                  <p className="text-sm font-medium text-gray-900">
                    {t('subscription.plan')}
                  </p>
                  <p className="text-gray-600">
                    {subscription.planName || subscription.statusFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('subscription.price')}
                  </p>
                  <p className="text-gray-600">
                    €{subscription.price} / {subscription.isUsageBased ? t('subscription.usage') : subscription.interval}
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
                      : t('subscription.renewsAt')
                    }
                  </p>
                  <p className="text-gray-600">
                    {formatDate(
                      subscription.status === 'cancelled'
                        ? subscription.endsAt
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
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={openCustomerPortal}
              disabled={!subscription.urls?.customer_portal}
              outlined
              size="small"
            />

            <Button
              label={t('subscription.updatePayment')}
              icon="pi pi-credit-card"
              onClick={openCustomerPortal}
              disabled={!subscription.urls?.update_payment_method}
              outlined
              size="small"
            />
          </div>
        </>
      )}
    </div>
  )

  return embedded ? subscriptionContent : (
    <Card className="mb-6">
      {subscriptionContent}
    </Card>
  )
}