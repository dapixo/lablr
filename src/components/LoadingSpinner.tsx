import React from 'react'

interface LoadingSpinnerProps {
  /**
   * Texte à afficher sous le spinner
   */
  text?: string
  /**
   * Taille du spinner (défaut: 12 = 48px)
   */
  size?: number
  /**
   * Classes CSS additionnelles pour le conteneur
   */
  className?: string
  /**
   * Affichage en plein écran (défaut: true)
   */
  fullScreen?: boolean
}

/**
 * Composant LoadingSpinner réutilisable
 * Utilisé pour le chargement initial des traductions et de l'authentification
 */
export const LoadingSpinner = React.memo(function LoadingSpinner({
  text,
  size = 12,
  className = '',
  fullScreen = true,
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'
    : 'flex items-center justify-center'

  // Map des tailles possibles (Tailwind nécessite des classes complètes)
  const sizeClasses = {
    8: 'h-8 w-8',
    10: 'h-10 w-10',
    12: 'h-12 w-12',
    16: 'h-16 w-16',
  }

  const spinnerSize = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses[12]

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className={`inline-block animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600 mb-4`} />
        {text && <p className="text-gray-600 text-sm">{text}</p>}
      </div>
    </div>
  )
})
