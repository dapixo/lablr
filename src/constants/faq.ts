// FAQ IDs pour la génération des clés de traduction
// Les questions/réponses sont dans messages/fr.json et messages/en.json
// sous les clés: faq.questions.${id}.question et faq.questions.${id}.answer
const ALL_FAQ_IDS = [
  'security',
  'files',
  'account',
  'platforms',
  'formats',
  'pricing'
] as const

/**
 * Retourne les IDs de FAQ à afficher
 */
export function getVisibleFAQIds(): readonly string[] {
  return ALL_FAQ_IDS
}

// Export pour rétrocompatibilité (affiche toutes les questions)
export const FAQ_IDS = ALL_FAQ_IDS

export type FAQId = typeof ALL_FAQ_IDS[number]
