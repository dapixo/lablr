'use client'

import { Heart, Lightbulb, Mail, MessageSquareText, Zap } from 'lucide-react'
import React from 'react'

interface FeedbackSectionProps {
  className?: string
  t: (key: string) => string
}

function FeedbackSection({ className, t }: FeedbackSectionProps) {
  // Créer le mailto avec sujet et corps pré-remplis
  const subject = encodeURIComponent(t('feedback.email.subject'))
  const body = encodeURIComponent(`${t('feedback.email.greeting')}

${t('feedback.email.intro')}

${t('feedback.email.placeholder')}

${t('feedback.email.typeTitle')}
□ ${t('feedback.email.types.formats')}
□ ${t('feedback.email.types.features')}
□ ${t('feedback.email.types.ui')}
□ ${t('feedback.email.types.integration')}
□ ${t('feedback.email.types.other')}

${t('feedback.email.thanks')}`)

  const mailtoLink = `mailto:contact@lalabel.app?subject=${subject}&body=${body}`

  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('feedback.benefits.responsive'),
      description: t('feedback.benefits.responsiveDesc'),
      color: 'text-blue-600',
    },
    {
      icon: <MessageSquareText className="h-6 w-6" />,
      title: t('feedback.benefits.implementation'),
      description: t('feedback.benefits.implementationDesc'),
      color: 'text-green-600',
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: t('feedback.benefits.community'),
      description: t('feedback.benefits.communityDesc'),
      color: 'text-pink-600',
    },
  ]

  const suggestions = [
    t('feedback.suggestions.formats'),
    t('feedback.suggestions.features'),
    t('feedback.suggestions.improvements'),
    t('feedback.suggestions.integrations'),
  ]

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquareText className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t('feedback.title')}</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t('feedback.subtitle')}</p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-200"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white mb-4 ${benefit.color}`}
              >
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Section unifiée: Suggestions + CTA */}
        <div className="text-center">
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('feedback.cta.title')}</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('feedback.cta.description')}
            </p>

            {/* Suggestions intégrées */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200">
                  <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{suggestion}</span>
                </div>
              ))}
            </div>

            <a
              href={mailtoLink}
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Mail className="h-5 w-5 mr-2" />
              {t('feedback.cta.button')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(FeedbackSection)
