// FAQ IDs pour la génération des clés de traduction
// Les questions/réponses sont dans messages/fr.json et messages/en.json
// sous les clés: faq.questions.${id}.question et faq.questions.${id}.answer
export const FAQ_IDS = [
  'security',
  'files',
  'account',
  'platforms',
  'formats',
  'pricing'
] as const

export type FAQId = typeof FAQ_IDS[number]
