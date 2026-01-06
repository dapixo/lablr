interface StructuredDataProps {
  locale: string
}

export function StructuredData({ locale }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name:
      locale === 'fr' ? "Lalabel - Générateur d'Étiquettes" : 'Lalabel - Shipping Label Generator',
    description:
      locale === 'fr'
        ? "Créez et imprimez vos étiquettes d'expédition depuis Amazon Seller, Shopify, eBay. Tous formats : Avery, A4, rouleaux. Traitement 100% local et sécurisé."
        : 'Create and print shipping labels from Amazon Seller, Shopify, eBay. All formats: Avery, A4, thermal rolls. 100% local and secure processing.',
    url: 'https://lalabel.app',
    logo: 'https://lalabel.app/logo.png',
    image: 'https://lalabel.app/og-image.jpg',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'HTML5, CSS3, JavaScript enabled',
    downloadUrl: 'https://lalabel.app',
    installUrl: 'https://lalabel.app',
    softwareVersion: '4.0',
    releaseNotes:
      locale === 'fr'
        ? 'Système de paiement Dodo Payments avec webhook robuste et cache React Query optimisé'
        : 'Dodo Payments system with robust webhook and optimized React Query caching',
    featureList:
      locale === 'fr'
        ? [
            'Import multi-plateformes (Amazon, Shopify, eBay)',
            'Formats A4, Avery et étiquettes thermiques',
            'Traitement local sécurisé des données',
            'Interface moderne et responsive',
            '5 étiquettes par impression gratuites',
            'Plan Premium illimité',
          ]
        : [
            'Multi-platform import (Amazon, Shopify, eBay)',
            'A4, Avery and thermal label formats',
            'Secure local data processing',
            'Modern responsive interface',
            '5 free labels per print',
            'Unlimited Premium plan',
          ],
    offers: [
      {
        '@type': 'Offer',
        name: locale === 'fr' ? 'Plan Gratuit' : 'Free Plan',
        price: '0',
        priceCurrency: 'EUR',
        priceValidUntil: '2025-12-31',
        availability: 'https://schema.org/InStock',
        category: 'Free',
        description:
          locale === 'fr'
            ? '10 étiquettes gratuites par jour, renouvelées automatiquement'
            : '10 free labels per day, automatically renewed',
      },
      {
        '@type': 'Offer',
        name: locale === 'fr' ? 'Plan Premium Mensuel' : 'Premium Monthly Plan',
        price: '5',
        priceCurrency: 'EUR',
        billingIncrement: 'Month',
        priceValidUntil: '2025-12-31',
        availability: 'https://schema.org/InStock',
        category: 'Premium',
        description:
          locale === 'fr'
            ? 'Étiquettes illimitées + support prioritaire'
            : 'Unlimited labels + priority support',
      },
      {
        '@type': 'Offer',
        name: locale === 'fr' ? 'Plan Premium Annuel' : 'Premium Yearly Plan',
        price: '48',
        priceCurrency: 'EUR',
        billingIncrement: 'Year',
        priceValidUntil: '2025-12-31',
        availability: 'https://schema.org/InStock',
        category: 'Premium',
        description:
          locale === 'fr'
            ? "Étiquettes illimitées - 33% d'économie"
            : 'Unlimited labels - 33% savings',
      },
    ],
    author: {
      '@type': 'Organization',
      name: 'Lalabel',
      url: 'https://lalabel.app',
      logo: 'https://lalabel.app/logo.png',
      sameAs: ['https://twitter.com/lalabel_app', 'https://linkedin.com/company/lalabel'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@lalabel.app',
        contactType: 'customer support',
        availableLanguage: ['French', 'English'],
        areaServed: ['FR', 'BE', 'CH', 'CA', 'US', 'DE', 'IT', 'ES', 'GB', 'NL'],
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lalabel',
      logo: 'https://lalabel.app/logo.png',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      reviewCount: '127',
      ratingCount: '127',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lalabel.app/${locale}`,
    },
    keywords:
      locale === 'fr'
        ? 'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit, rouleaux thermiques'
        : 'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free, thermal rolls',
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    dateCreated: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    isAccessibleForFree: true,
    accessibilityAPI: ['ARIA'],
    accessibilityControl: ['fullKeyboardControl', 'fullMouseControl', 'fullTouchControl'],
    accessibilityFeature: ['alternativeText', 'structuralNavigation'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
