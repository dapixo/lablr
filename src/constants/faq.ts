export interface FAQItem {
  id: string
  question: string
  answer: string
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'security',
    question: 'Mes données sont-elles sécurisées ?',
    answer: `Absolument ! Vos données sont traitées à 100% localement dans votre navigateur. 
    Aucun fichier n'est envoyé sur nos serveurs - tout le traitement se fait directement sur votre appareil. 
    Vos adresses et commandes restent entièrement privées et sécurisées.`,
  },
  {
    id: 'files',
    question: "Que faites-vous de mes fichiers d'import ?",
    answer: `Rien du tout ! Vos fichiers CSV/TSV ne quittent jamais votre navigateur. 
    Ils sont traités localement pour extraire les adresses, puis immédiatement supprimés de la mémoire. 
    Nous ne conservons, ne sauvegardons ni ne transmettons aucun de vos fichiers ou données personnelles.`,
  },
  {
    id: 'account',
    question: 'Pourquoi dois-je créer un compte ?',
    answer: `Le compte nous permet uniquement de compter le nombre d'utilisateurs actifs 
    pour améliorer le service. 
    Nous ne collectons que votre email - aucune donnée commerciale, aucune adresse client, 
    aucun fichier n'est lié à votre compte.`,
  },
  {
    id: 'platforms',
    question: 'Quelles plateformes sont supportées ?',
    answer: `Lalabel supporte automatiquement Amazon Seller Central, Shopify, eBay,
    ainsi que tous les fichiers CSV génériques. Notre système détecte automatiquement
    le format de votre fichier et extrait les bonnes colonnes d'adresses.
    Vous pouvez aussi importer n'importe quel CSV avec des colonnes d'adresses.`,
  },
  {
    id: 'formats',
    question: "Quels formats d'impression sont disponibles ?",
    answer: `Nous proposons plusieurs formats : A4 standard et compact,
    étiquettes autocollantes avec 10, 14, 16 ou 21 étiquettes par page,
    rouleaux d'étiquettes pour imprimantes thermiques,
    et export CSV. Tous les formats incluent un aperçu en temps réel.`,
  },
  {
    id: 'pricing',
    question: 'Comment fonctionne le modèle freemium ?',
    answer: `Lalabel vous offre 10 étiquettes gratuites chaque jour, renouvelées automatiquement.
    C'est parfait pour les petites expéditions. Si vous avez besoin de plus, notre plan Premium
    à 5€/mois (ou 50€/an) vous donne accès à des étiquettes illimitées avec support prioritaire.`,
  },
] as const
