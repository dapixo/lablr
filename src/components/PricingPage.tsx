'use client'

import { Check, Star, Zap } from 'lucide-react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthModal } from '@/components/auth/AuthModal'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useLemonSqueezyCheckout } from '@/hooks/useLemonSqueezyCheckout'

type TranslationFunction = (key: string) => string

interface PricingPageProps {
  t: TranslationFunction
}

interface PricingPlan {
  title: string
  price: string
  period?: string
  description?: string
  features: string[]
  popular?: string
  cta?: string
  savings?: string
}

const PRICING_CONFIG = {
  annualPrice: '€4',
  discountPercentage: '-33%',
  featureCount: 4,
} as const

const CARD_STYLES = {
  free: {
    base: 'p-10 shadow-xl rounded-2xl bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full',
    withUser: 'border-2 border-blue-500',
    withoutUser: 'border border-gray-200',
  },
  premium:
    'p-10 shadow-2xl border-2 border-blue-500 rounded-2xl bg-gradient-to-br from-white to-blue-50 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden h-full',
} as const

/**
 * Génère les données d'un plan tarifaire
 */
function createPricingPlan(
  t: TranslationFunction,
  planType: 'free' | 'premium',
  isAnnual = false
): PricingPlan {
  const baseKey = `pricing.${planType}`

  const features = Array.from({ length: PRICING_CONFIG.featureCount }, (_, index) =>
    t(`${baseKey}.features.${index}`)
  ).filter(Boolean) // Filtre les traductions vides

  if (planType === 'free') {
    return {
      title: t(`${baseKey}.title`),
      price: t(`${baseKey}.price`),
      features,
    }
  }

  return {
    title: t(`${baseKey}.title`),
    price: isAnnual ? PRICING_CONFIG.annualPrice : t(`${baseKey}.price`),
    period: isAnnual ? t(`${baseKey}.periodAnnualBilling`) : t(`${baseKey}.period`),
    features,
    popular: t(`${baseKey}.popular`),
    cta: t(`${baseKey}.cta`),
    savings: t(`${baseKey}.savings`),
  }
}

/**
 * Composant de page de tarification avec plans Free et Premium
 */
export function PricingPage({ t }: PricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingUpgrade, setPendingUpgrade] = useState(false)
  const { user, userPlan, loading } = useAuth()
  const { createCheckout, isLoading: isUpgrading, error: checkoutError } = useLemonSqueezyCheckout()
  const toast = useRef<Toast>(null)

  const { freePlan, premiumPlan } = useMemo(
    () => ({
      freePlan: createPricingPlan(t, 'free'),
      premiumPlan: createPricingPlan(t, 'premium', isAnnual),
    }),
    [t, isAnnual]
  )

  /**
   * Simule un upgrade vers Premium
   */
  const handleUpgradeToPremium = useCallback(async () => {
    if (!user) {
      setPendingUpgrade(true)
      setShowAuthModal(true)
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

    // Créer le checkout Lemon Squeezy
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
  }, [user, userPlan, createCheckout, isAnnual, t])

  // Déclencher l'upgrade automatiquement après connexion
  useEffect(() => {
    if (user && pendingUpgrade && userPlan !== 'premium') {
      setPendingUpgrade(false)
      // Déclencher le checkout automatiquement
      const performUpgrade = async () => {
        const success = await createCheckout(isAnnual ? 'yearly' : 'monthly')
        if (success) {
          toast.current?.show({
            severity: 'info',
            summary: t('pricing.checkout.redirecting.title'),
            detail: t('pricing.checkout.redirecting.message'),
            life: 3000,
          })
        }
      }
      performUpgrade()
    }
  }, [user, pendingUpgrade, userPlan, createCheckout, isAnnual, t])

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <Header t={t} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{t('pricing.page.title')}</h1>
          <p className="text-base text-blue-100 max-w-xl mx-auto">
            {t('pricing.page.subtitle')}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Billing Toggle */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 gap-1 relative shadow-lg">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                !isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.page.billingToggle.monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.page.billingToggle.annually')}
            </button>
            {isAnnual && (
              <Tag
                value="-33%"
                rounded
                severity="success"
                className="absolute -top-3 -right-3 font-bold shadow-lg animate-pulse"
              />
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="relative h-full">
            {!loading && user && userPlan === 'free' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Tag
                  value={t('pricing.page.cta.currentPlan')}
                  rounded
                  severity="info"
                  className="font-bold shadow-lg"
                />
              </div>
            )}
            <Card
              className={`${CARD_STYLES.free.base} ${
                !loading && user ? CARD_STYLES.free.withUser : CARD_STYLES.free.withoutUser
              }`}
            >
              <div className="text-center h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{freePlan.title}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{freePlan.price}</span>
                </div>

                <div className="flex-1 space-y-4 text-left mb-8">
                  {freePlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {!loading && !user && (
                  <Button
                    className="w-full py-4 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 justify-center mt-auto"
                    onClick={() => setShowAuthModal(true)}
                  >
                    {t('pricing.page.cta.free')}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Premium Plan */}
          <div className="relative h-full">
            {/* Popular Badge ou Current Plan Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              {!loading && user && userPlan === 'premium' ? (
                <Tag
                  value={t('pricing.page.cta.currentPlan')}
                  rounded
                  severity="success"
                  className="font-bold shadow-lg"
                />
              ) : (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Star className="h-4 w-4 fill-current" />
                  {premiumPlan.popular}
                </div>
              )}
            </div>

            <Card className={CARD_STYLES.premium}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -translate-y-16 translate-x-16"></div>

              {/* Badge de réduction - Style bandeau diagonal */}
              {isAnnual && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-lg shadow-lg transform rotate-12 font-bold text-sm">
                    🎉 {PRICING_CONFIG.discountPercentage}
                  </div>
                </div>
              )}

              <div className="text-center relative h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{premiumPlan.title}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {premiumPlan.price}
                  </span>
                  <span className="text-gray-600 ml-2 text-lg">{premiumPlan.period}</span>
                </div>

                <div className="flex-1 space-y-4 text-left mb-8">
                  {premiumPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 leading-relaxed font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {!loading && user && userPlan === 'premium' ? (
                  <Button
                    disabled
                    className="w-full py-4 text-lg font-semibold bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed mt-auto justify-center"
                  >
                    {t('pricing.page.cta.activePlan')}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpgradeToPremium}
                    loading={isUpgrading}
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 justify-center mt-auto"
                  >
                    {t('pricing.page.cta.premium')}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>

      {/* Footer */}
      <Footer t={t} />

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        t={t}
      />

      {/* Toast pour les notifications */}
      <Toast ref={toast} />
    </div>
  )
}
