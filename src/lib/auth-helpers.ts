/**
 * Helpers partagés pour l'authentification OTP
 */

/**
 * Extrait le délai depuis un message d'erreur de rate limit
 */
export function extractRateLimitDelay(message: string): number | null {
  // Chercher des patterns comme "once every 45 seconds" ou "wait 30 seconds" ou "after 57 seconds"
  const patterns = [
    /once every (\d+) seconds?/i,
    /wait (\d+) seconds?/i,
    /(\d+) seconds? before/i,
    /after (\d+) seconds?/i,       // "after 57 seconds"
    /request this after (\d+)/i,   // "request this after 57"
    /wait (\d+)/i,                 // "wait 30"
    /(\d+) seconds?\./i            // "57 seconds."
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
}

/**
 * Mappe les erreurs Supabase vers des messages traduits
 */
export function getErrorMessage(message: string, t: (key: string) => string): string {
  // Erreurs OTP spécifiques
  if (message.includes('otp_expired')) {
    return t('auth.errors.expiredCode')
  }
  if (message.includes('invalid_otp')) {
    return t('auth.errors.invalidCode')
  }
  if (message.includes('Token has expired or is invalid')) {
    return t('auth.errors.invalidCode')
  }
  // Erreurs générales
  if (message.includes('Unable to validate email address')) {
    return t('auth.errors.invalidEmail')
  }
  // Rate limit avec délai adaptatif
  if (message.includes('rate_limit') || message.includes('too_many_requests') ||
      message.includes('For security purposes') || message.includes('once every')) {
    const delay = extractRateLimitDelay(message)
    if (delay) {
      return (t as any)('auth.errors.rateLimit', { seconds: delay.toString() })
    }
    return t('auth.errors.rateLimitGeneric')
  }
  return message
}

/**
 * Vérifie si une erreur est liée au rate limiting
 */
export function isRateLimitError(message: string): boolean {
  return message.includes('rate_limit') ||
         message.includes('too_many_requests') ||
         message.includes('For security purposes') ||
         message.includes('once every')
}