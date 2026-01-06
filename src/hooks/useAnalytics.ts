import { track } from '@vercel/analytics'

/**
 * Hook personnalisé pour tracker les événements business de Lablr
 * Utilise Vercel Analytics avec des événements métier spécifiques
 */

export interface LabelGeneratedEvent {
  format: string
  count: number
  userPlan: 'free' | 'premium'
}

export interface UpgradeEvent {
  source: 'limit_modal' | 'pricing_page' | 'header_button' | 'account_page'
  triggeredBy: 'limit_exceeded' | 'proactive' | 'discovery'
}

export interface PaymentEvent {
  plan: 'monthly' | 'yearly'
  amount: string
  currency: string
  previousPlan: 'free' | 'premium'
}

export interface FileUploadEvent {
  fileType: 'csv' | 'tsv'
  platform: 'amazon' | 'shopify' | 'ebay' | 'generic' | 'unknown'
  addressCount: number
  fileSize: number
}

export interface AuthEvent {
  action: 'login' | 'register' | 'logout'
  method: 'otp_email'
  success: boolean
}

/**
 * Hook principal pour analytics Lablr
 */
export function useAnalytics() {
  /**
   * Track génération d'étiquettes
   */
  const trackLabelGenerated = (event: LabelGeneratedEvent) => {
    track('Label Generated', {
      format: event.format,
      count: event.count,
      userPlan: event.userPlan,
    })
  }

  /**
   * Track tentatives d'upgrade
   */
  const trackUpgradeAttempt = (event: UpgradeEvent) => {
    track('Upgrade Attempt', {
      source: event.source,
      triggeredBy: event.triggeredBy,
    })
  }

  /**
   * Track conversions payment réussies
   */
  const trackPaymentSuccess = (event: PaymentEvent) => {
    track('Payment Success', {
      plan: event.plan,
      amount: event.amount,
      currency: event.currency,
      previousPlan: event.previousPlan,
    })
  }

  /**
   * Track upload de fichiers
   */
  const trackFileUpload = (event: FileUploadEvent) => {
    track('File Upload', {
      fileType: event.fileType,
      platform: event.platform,
      addressCount: event.addressCount,
      fileSize: event.fileSize,
    })
  }

  /**
   * Track événements d'authentification
   */
  const trackAuth = (event: AuthEvent) => {
    track('Auth Event', {
      action: event.action,
      method: event.method,
      success: event.success,
    })
  }

  /**
   * Track pages visitées avec contexte
   */
  const trackPageView = (page: string, context?: Record<string, string | number | boolean>) => {
    track('Page View', {
      page,
      ...context,
    })
  }

  /**
   * Track erreurs utilisateur importantes
   */
  const trackError = (
    errorType: string,
    errorMessage: string,
    context?: Record<string, string | number | boolean>
  ) => {
    track('User Error', {
      errorType,
      errorMessage: errorMessage.slice(0, 100), // Limiter la longueur
      ...context,
    })
  }

  return {
    trackLabelGenerated,
    trackUpgradeAttempt,
    trackPaymentSuccess,
    trackFileUpload,
    trackAuth,
    trackPageView,
    trackError,
  }
}

/**
 * Helper pour tracker automatiquement les Core Web Vitals
 * (déjà fait automatiquement par @vercel/analytics mais on peut customiser)
 */
export function trackWebVitals() {
  // Les Core Web Vitals sont automatiquement trackés par Vercel Analytics
  // Cette fonction est prête pour des métriques custom si nécessaire
}

// Types exportés en haut du fichier
