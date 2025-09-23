/**
 * Helpers partagés pour l'authentification OTP avec optimisations
 */

import { EMAIL_VALIDATION_ERRORS } from './disposable-email-domains'

/**
 * Patterns de rate limiting précompilés pour performance
 */
const RATE_LIMIT_PATTERNS = [
  /once every (\d+) seconds?/i,
  /wait (\d+) seconds?/i,
  /(\d+) seconds? before/i,
  /after (\d+) seconds?/i,
  /request this after (\d+)/i,
  /wait (\d+)/i,
  /(\d+) seconds?\./i
] as const

/**
 * Codes d'erreur OTP standardisés
 */
const OTP_ERROR_CODES = [
  'otp_expired',
  'invalid_otp',
  'Token has expired or is invalid'
] as const

/**
 * Indicateurs de rate limiting
 */
const RATE_LIMIT_INDICATORS = [
  'rate_limit',
  'too_many_requests',
  'For security purposes',
  'once every'
] as const

/**
 * Extrait le délai depuis un message d'erreur de rate limit
 * Version optimisée avec patterns précompilés
 */
export function extractRateLimitDelay(message: string): number | null {
  for (const pattern of RATE_LIMIT_PATTERNS) {
    const match = message.match(pattern)
    if (match?.[1]) {
      const delay = parseInt(match[1], 10)
      return isNaN(delay) ? null : delay
    }
  }
  return null
}

/**
 * Type pour les fonctions de traduction avec support des variables
 */
export type TranslationFunction = {
  (key: string): string
  (key: string, variables: Record<string, string>): string
}

/**
 * Vérifie si une erreur est liée à un code OTP invalide/expiré
 */
export function isOTPError(message: string): boolean {
  return OTP_ERROR_CODES.some(code =>
    message.toLowerCase().includes(code.toLowerCase())
  )
}

/**
 * Mappe les erreurs Supabase vers des messages traduits
 * Version optimisée avec constantes et fonctions helper
 */
export function getErrorMessage(message: string, t: TranslationFunction): string {
  // Erreurs OTP avec fonction helper optimisée
  if (isOTPError(message)) {
    return message.toLowerCase().includes('expired')
      ? t('auth.errors.expiredCode')
      : t('auth.errors.invalidCode')
  }

  // Erreurs de validation email avec constantes
  if (message.includes(EMAIL_VALIDATION_ERRORS.INVALID_FORMAT)) {
    return t('auth.errors.invalidEmail')
  }
  if (message.includes(EMAIL_VALIDATION_ERRORS.DISPOSABLE_DOMAIN)) {
    return t('auth.errors.disposableEmail')
  }
  if (message.includes('Unable to validate email address')) {
    return t('auth.errors.invalidEmail')
  }

  // Rate limit avec délai adaptatif
  if (isRateLimitError(message)) {
    const delay = extractRateLimitDelay(message)
    if (delay) {
      // Type assertion sécurisée pour les fonctions surchargées
      return (t as any)('auth.errors.rateLimit', { seconds: delay.toString() })
    }
    return t('auth.errors.rateLimitGeneric')
  }

  return message
}

/**
 * Vérifie si une erreur est liée au rate limiting
 * Version optimisée avec indicateurs prédefinis
 */
export function isRateLimitError(message: string): boolean {
  return RATE_LIMIT_INDICATORS.some(indicator =>
    message.toLowerCase().includes(indicator.toLowerCase())
  )
}