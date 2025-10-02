'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useTranslations } from '@/hooks/useTranslations'

export default function PrivacyPage() {
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
              {t('privacy.title')}
            </h1>
            <p className="text-gray-600">
              {t('privacy.effectiveDate')}: {t('privacy.date')}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed mb-8">
              {t('privacy.intro')}
            </p>

            {/* Section 1: Informations collectées */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">1.</span>
                {t('privacy.informationWeCollect.title')}
              </h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('privacy.informationWeCollect.purchase.title')}
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.informationWeCollect.purchase.content')}
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('privacy.informationWeCollect.analytics.title')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.informationWeCollect.analytics.content')}
              </p>
            </section>

            {/* Section 2: Informations non collectées */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">2.</span>
                {t('privacy.informationWeDoNotCollect.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.informationWeDoNotCollect.content')}
              </p>
            </section>

            {/* Section 3: Utilisation des informations */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">3.</span>
                {t('privacy.howWeUseInformation.title')}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>{t('privacy.howWeUseInformation.support')}</li>
                <li>{t('privacy.howWeUseInformation.updates')}</li>
              </ul>
            </section>

            {/* Section 4: Vos choix */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">4.</span>
                {t('privacy.yourChoices.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.yourChoices.content')}
              </p>
            </section>

            {/* Section 5: Sécurité */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">5.</span>
                {t('privacy.security.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.security.content')}
              </p>
            </section>

            {/* Section 6: Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">6.</span>
                {t('privacy.contact.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.contact.content')}{' '}
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
