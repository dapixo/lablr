import React from 'react'

interface HeroStepsProps {
  t: (key: string) => string
  variant?: 'compact' | 'full'
}

/**
 * Composant réutilisable pour afficher les 3 étapes du processus
 * Utilisé sur la home page et potentiellement ailleurs
 */
export const HeroSteps = React.memo<HeroStepsProps>(function HeroSteps({ t, variant = 'compact' }) {
  const isCompact = variant === 'compact'

  return (
    <div className={`grid md:grid-cols-3 ${isCompact ? 'gap-6' : 'gap-8'}`}>
      {/* Étape 1 : Upload */}
      <div className="text-center">
        <div
          className={`${isCompact ? 'w-12 h-12 mb-3' : 'w-14 h-14 mb-4'} rounded-xl bg-blue-100 flex items-center justify-center mx-auto`}
        >
          <i className={`pi pi-upload text-blue-600 ${isCompact ? 'text-lg' : 'text-xl'}`} />
        </div>
        <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm mb-1' : 'mb-2'}`}>
          {t('steps.1.title')}
        </h3>
        <p className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {t('steps.1.description')}
        </p>
      </div>

      {/* Étape 2 : Configuration */}
      <div className="text-center">
        <div
          className={`${isCompact ? 'w-12 h-12 mb-3' : 'w-14 h-14 mb-4'} rounded-xl bg-green-100 flex items-center justify-center mx-auto`}
        >
          <i className={`pi pi-cog text-green-600 ${isCompact ? 'text-lg' : 'text-xl'}`} />
        </div>
        <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm mb-1' : 'mb-2'}`}>
          {t('steps.2.title')}
        </h3>
        <p className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {t('steps.2.description')}
        </p>
      </div>

      {/* Étape 3 : Impression */}
      <div className="text-center">
        <div
          className={`${isCompact ? 'w-12 h-12 mb-3' : 'w-14 h-14 mb-4'} rounded-xl bg-purple-100 flex items-center justify-center mx-auto`}
        >
          <i className={`pi pi-print text-purple-600 ${isCompact ? 'text-lg' : 'text-xl'}`} />
        </div>
        <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm mb-1' : 'mb-2'}`}>
          {t('steps.3.title')}
        </h3>
        <p className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {t('steps.3.description')}
        </p>
      </div>
    </div>
  )
})
