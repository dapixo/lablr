'use client'

interface StructuredDataProps {
  locale: string
}

export function StructuredData({ locale }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: locale === 'fr' ? "Lalabel - Générateur d'Étiquettes" : 'Lalabel - Shipping Label Generator',
    description: locale === 'fr'
      ? "Créez et imprimez vos étiquettes d'expédition depuis Amazon Seller, Shopify, eBay. Tous formats : Avery, A4, rouleaux. 100% gratuit."
      : 'Create and print shipping labels from Amazon Seller, Shopify, eBay. All formats: Avery, A4, thermal rolls. 100% free.',
    url: 'https://lalabel.app',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: locale === 'fr' ? 'EUR' : 'USD',
      description: locale === 'fr' ? '100% Gratuit' : '100% Free'
    },
    author: {
      '@type': 'Organization',
      name: 'Lalabel'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    },
    keywords: locale === 'fr'
      ? 'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit'
      : 'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}