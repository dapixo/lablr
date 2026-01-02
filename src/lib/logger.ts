/**
 * Système de logging centralisé pour LABLR
 * En production : seules les erreurs sont loggées
 * En développement : tous les logs sont affichés
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Logs d'information (développement uniquement)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Logs d'avertissement (développement uniquement)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Logs d'erreur (toujours affichés, même en production)
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },

  /**
   * Logs de debug (développement uniquement)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}
