'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'

/**
 * Page 404 personnalisée multilingue
 * Optimisée SEO avec liens internes utiles
 */
export default function NotFound() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icône 404 stylisée */}
        <div className="mb-8">
          <div className="inline-block">
            <div className="flex items-center gap-4">
              <span className="text-8xl font-bold text-gray-200">4</span>
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="pi pi-search text-blue-600 text-3xl"></i>
              </div>
              <span className="text-8xl font-bold text-gray-200">4</span>
            </div>
          </div>
        </div>

        {/* Titre et description */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t('notFound.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('notFound.description')}
        </p>

        {/* CTA principal */}
        <div className="mb-12">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            <i className="pi pi-home"></i>
            <span>{t('notFound.cta')}</span>
          </Link>
        </div>

        {/* Liens internes utiles - SEO */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('notFound.popularPages')}
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            {/* Générateur d'étiquettes */}
            <Link
              href={`/${locale}`}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <i className="pi pi-print text-blue-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('notFound.links.generator.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('notFound.links.generator.description')}
                </p>
              </div>
            </Link>

            {/* Tarifs */}
            <Link
              href={`/${locale}/pricing`}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <i className="pi pi-tag text-green-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('notFound.links.pricing.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('notFound.links.pricing.description')}
                </p>
              </div>
            </Link>

            {/* FAQ */}
            <Link
              href={`/${locale}#faq`}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-purple-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                <i className="pi pi-question-circle text-purple-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('notFound.links.faq.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('notFound.links.faq.description')}
                </p>
              </div>
            </Link>

            {/* Connexion */}
            <Link
              href={`/${locale}/login`}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-orange-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                <i className="pi pi-user text-orange-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('notFound.links.login.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('notFound.links.login.description')}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Message de contact */}
        <p className="mt-8 text-sm text-gray-500">
          {t('notFound.needHelp')}{' '}
          <a
            href="mailto:contact@lalabel.app"
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            {t('notFound.contactUs')}
          </a>
        </p>
      </div>
    </div>
  )
}
