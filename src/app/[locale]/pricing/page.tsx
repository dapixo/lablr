'use client'

import { useParams } from 'next/navigation'
import { PricingPage } from '@/components/PricingPage'
import { useTranslations } from '@/hooks/useTranslations'

export default function Pricing() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)

  return <PricingPage t={t} />
}
