'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useTranslations } from '@/hooks/useTranslations'

export default function RefundPage() {
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
              {t('refund.title')}
            </h1>
            <p className="text-gray-600">
              {t('refund.effectiveDate')}: {t('refund.date')}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed mb-8">
              {t('refund.intro')}
            </p>

            {/* Section: Garantie 14 jours */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">•</span>
                {t('refund.guarantee.title')}
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{t('refund.guarantee.point1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{t('refund.guarantee.point2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{t('refund.guarantee.point3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{t('refund.guarantee.point4')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{t('refund.guarantee.point5')}</span>
                </li>
              </ul>
            </section>

            {/* Section Contact */}
            <section className="mb-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">•</span>
                {t('refund.contact.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('refund.contact.content')}{' '}
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
