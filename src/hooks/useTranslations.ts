/**
 * Hook de traductions optimisé avec lazy loading
 *
 * IMPORTANT: Ce hook est maintenant un wrapper léger qui utilise TranslationsContext.
 * Les traductions sont chargées dynamiquement uniquement pour la locale active,
 * réduisant le bundle initial de ~87KB à ~29KB max par page.
 *
 * @param locale - Code de langue (fr, en, es)
 * @returns Fonction de traduction t(key, variables)
 */

import { useTranslationsContext } from '@/contexts/TranslationsContext'

export type TranslationVariables = Record<string, string | number | boolean>

/**
 * Hook pour accéder aux traductions dans les composants
 * Utilise le TranslationsContext fourni par le layout
 *
 * @param _locale - Paramètre ignoré, conservé pour rétrocompatibilité
 * @returns Fonction de traduction
 */
export function useTranslations(_locale?: string) {
  const { t } = useTranslationsContext()
  return t
}
