'use client'

import { Check, Star, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Lazy loading du AuthModal pour améliorer FCP
const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(mod => ({ default: mod.AuthModal })), {
  loading: () => <Skeleton width="100%" height="400px" />,
  ssr: false,
})
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
    period: isAnnual ? t(`${baseKey}.periodAnnualBilling`) : '',
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
  const [isAnnual, setIsAnnual] = useState(true)
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
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gray-900">{t('pricing.page.title').split(' ')[0]} </span>
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {t('pricing.page.title').split(' ').slice(1).join(' ')}
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('pricing.page.subtitle')}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          {/* Free Plan */}
          <div className="relative">
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
              className={`p-8 shadow-lg rounded-2xl bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 ${
                !loading && user && userPlan === 'free' ? 'border-2 border-blue-500' : ''
              }`}
            >
              <div className="text-center flex flex-col">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-7 w-7 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{freePlan.title}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{freePlan.price}</span>
                </div>

                <div className="space-y-3 text-left mb-6">
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
                    className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 rounded-xl transition-all duration-200 justify-center"
                    onClick={() => setShowAuthModal(true)}
                  >
                    {t('pricing.page.cta.free')}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Premium Plan */}
          <div className="relative">
            {/* Popular Badge ou Current Plan Badge */}
            {!loading && user && userPlan === 'premium' ? (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                <Tag
                  value={t('pricing.page.cta.currentPlan')}
                  rounded
                  severity="success"
                  className="font-bold shadow-lg"
                />
              </div>
            ) : (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Star className="h-4 w-4 fill-current" />
                  {premiumPlan.popular}
                </div>
              </div>
            )}

            <Card className="p-10 shadow-2xl border-2 border-blue-500 rounded-2xl bg-gradient-to-br from-white to-blue-50 hover:shadow-3xl transition-all duration-300 relative overflow-hidden">
              {/* Rond décoratif bleu - en arrière-plan, coupé par overflow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>

              {/* Badge de réduction -33% en haut à droite - au-dessus du rond */}
              {isAnnual && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg shadow-lg transform rotate-12 font-bold text-sm">
                    🎉 -33%
                  </div>
                </div>
              )}

              <div className="text-center relative h-full flex flex-col">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{premiumPlan.title}</h3>

                {/* Toggle de facturation intégré */}
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
                    <button
                      onClick={() => setIsAnnual(false)}
                      className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-xs ${
                        !isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      {t('pricing.page.billingToggle.monthly')}
                    </button>
                    <button
                      onClick={() => setIsAnnual(true)}
                      className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-xs ${
                        isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      {t('pricing.page.billingToggle.annually')}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div>
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      {premiumPlan.price}
                    </span>
                    <span className="text-2xl text-gray-600 ml-2">/mois</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{premiumPlan.period}</div>
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
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 justify-center mt-auto"
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
