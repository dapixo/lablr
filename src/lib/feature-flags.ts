/**
 * Configuration des feature flags de l'application
 *
 * Permet d'activer/désactiver des fonctionnalités sans redéploiement
 */

export const FEATURE_FLAGS = {
  /**
   * Active/désactive le mode premium avec système freemium
   *
   * Quand désactivé:
   * - Pas de limite d'impression
   * - UpgradeModal masquée
   * - Page Pricing masquée
   * - Section status compte masquée
   * - Question FAQ freemium masquée
   */
  PREMIUM_MODE_ENABLED: false,
} as const

/**
 * Vérifie si le mode premium est activé
 */
export function isPremiumModeEnabled(): boolean {
  return FEATURE_FLAGS.PREMIUM_MODE_ENABLED
}
