import type { TranslationVariables } from '@/hooks/useTranslations'

/**
 * Helpers pour l'internationalisation
 */

/**
 * Calcule les variables de pluriel pour les traductions
 */
export function getPluralVariables(count: number): TranslationVariables {
  return {
    count,
    plural: count > 1 ? 's' : '',
    // Pour les adjectifs français féminins (gratuite -> gratuites)
    pluralFem: count > 1 ? 's' : '',
    // Pour la phrase "première adresse" vs "3 premières adresses"
    firstText: count === 1 ? 'la' : 'les',
    addressText: count === 1 ? 'première' : 'premières',
  }
}

/**
 * Convertit le markdown simple (**text**) en HTML
 */
export function markdownToHtml(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

/**
 * Crée un objet dangerouslySetInnerHTML pour React
 */
export function createInnerHTML(htmlString: string): { __html: string } {
  return { __html: htmlString }
}
