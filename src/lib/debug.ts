/**
 * Utilities de debug pour l'application
 * ⚡ Centralisé pour éviter duplication (AuthContext, TranslationsContext, etc.)
 */

/**
 * Logger conditionnel activé via query param ?debug=true
 *
 * Usage:
 * ```typescript
 * import { debugLog } from '@/lib/debug'
 * debugLog('User logged in:', user.email)
 * ```
 *
 * Activer: https://app.com/?debug=true
 */
export function debugLog(...args: unknown[]): void {
  if (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true'
  ) {
    console.log(...args)
  }
}

/**
 * Vérifie si le mode debug est activé
 */
export function isDebugMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true'
  )
}
