'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useTranslations } from '@/hooks/useTranslations'

export default function TermsPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-gray-50">
      <Header t={t} />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t('terms.title')}
            </h1>
            <p className="text-gray-600">
              {t('terms.effectiveDate')}: {t('terms.date')}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed mb-8">
              {t('terms.intro')}
            </p>

            {/* Section 1: Refund Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">1.</span>
                {t('terms.refundPolicy.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.refundPolicy.content')}
              </p>
            </section>

            {/* Section 2: Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">2.</span>
                {t('terms.intellectualProperty.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.intellectualProperty.content')}
              </p>
            </section>

            {/* Section 3: Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">3.</span>
                {t('terms.disclaimer.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.disclaimer.content')}
              </p>
            </section>

            {/* Section 4: Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">4.</span>
                {t('terms.limitationOfLiability.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.limitationOfLiability.content')}
              </p>
            </section>

            {/* Section 5: Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">5.</span>
                {t('terms.governingLaw.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.governingLaw.content')}
              </p>
            </section>

            {/* Section 6: Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">6.</span>
                {t('terms.contact.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('terms.contact.content')}{' '}
                <a
                  href="mailto:contact@lalabel.app"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  contact@lalabel.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}
