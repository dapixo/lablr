import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
import { StructuredData } from '@/components/SEO/StructuredData'
import { AuthProvider } from '@/contexts/AuthContext'
import { TranslationsProvider } from '@/contexts/TranslationsContext'
import { locales } from '@/i18n/config'
import { QueryProvider } from '@/providers/QueryProvider'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = 'https://lalabel.app'

  // SEO optimized metadata based on locale
  if (locale === 'fr') {
    return {
      title: "Lalabel - Générateur d'Étiquettes d'Expédition | Impression Amazon, Shopify, eBay",
      description:
        "Créez vos étiquettes d'expédition Amazon, Shopify, eBay. Gratuit : 10/jour. Premium illimité : 6€/mois. Formats Avery, A4, rouleaux.",
      keywords:
        'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit',
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          fr: `${baseUrl}/fr`,
          en: `${baseUrl}/en`,
          es: `${baseUrl}/es`,
          'x-default': `${baseUrl}/fr`,
        },
      },
      openGraph: {
        title: "Lalabel - Générateur d'Étiquettes d'Expédition Gratuit",
        description:
          "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Tous formats : Avery, A4, rouleaux.",
        type: 'website',
        locale: 'fr_FR',
        url: `${baseUrl}/${locale}`,
        siteName: 'Lalabel',
        images: [
          {
            url: `${baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: "Lalabel - Générateur d'étiquettes d'expédition",
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: "Lalabel - Générateur d'Étiquettes d'Expédition",
        description:
          "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Gratuit et sécurisé.",
        images: [`${baseUrl}/og-image.jpg`],
      },
      manifest: '/manifest.json',
    }
  } else if (locale === 'en') {
    return {
      title: 'Lalabel - Shipping Label Generator | Print Amazon, Shopify, eBay Labels',
      description:
        'Print shipping labels from Amazon, Shopify, eBay. Free: 10/day. Unlimited Premium: €6/mo. Avery, A4, thermal rolls.',
      keywords:
        'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free',
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          fr: `${baseUrl}/fr`,
          en: `${baseUrl}/en`,
          es: `${baseUrl}/es`,
          'x-default': `${baseUrl}/fr`,
        },
      },
      openGraph: {
        title: 'Lalabel - Free Shipping Label Generator',
        description:
          'Create and print shipping labels from Amazon, Shopify, eBay. All formats: Avery, A4, thermal rolls.',
        type: 'website',
        locale: 'en_US',
        url: `${baseUrl}/${locale}`,
        siteName: 'Lalabel',
        images: [
          {
            url: `${baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: 'Lalabel - Shipping Label Generator',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Lalabel - Shipping Label Generator',
        description:
          'Create and print shipping labels from Amazon, Shopify, eBay. Free and secure.',
        images: [`${baseUrl}/og-image.jpg`],
      },
      manifest: '/manifest.json',
    }
  } else {
    // Espagnol (ES)
    return {
      title: 'Lalabel - Generador de Etiquetas de Envío | Imprimir Amazon, Shopify, eBay',
      description:
        'Crea etiquetas de envío de Amazon, Shopify, eBay. Gratis: 10/día. Premium ilimitado: 6€/mes. Formatos Avery, A4, rollos.',
      keywords:
        'generador etiquetas envío, imprimir etiquetas, etiquetas dirección, Amazon Seller, Shopify, eBay, etiquetas Avery, A4, gratis',
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          fr: `${baseUrl}/fr`,
          en: `${baseUrl}/en`,
          es: `${baseUrl}/es`,
          'x-default': `${baseUrl}/fr`,
        },
      },
      openGraph: {
        title: 'Lalabel - Generador de Etiquetas de Envío Gratis',
        description:
          'Crea e imprime etiquetas de envío desde Amazon, Shopify, eBay. Todos los formatos: Avery, A4, rollos térmicos.',
        type: 'website',
        locale: 'es_ES',
        url: `${baseUrl}/${locale}`,
        siteName: 'Lalabel',
        images: [
          {
            url: `${baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: 'Lalabel - Generador de etiquetas de envío',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Lalabel - Generador de Etiquetas de Envío',
        description:
          'Crea e imprime etiquetas de envío desde Amazon, Shopify, eBay. Gratis y seguro.',
        images: [`${baseUrl}/og-image.jpg`],
      },
      manifest: '/manifest.json',
    }
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as 'fr' | 'en')) {
    notFound()
  }

  // Messages will be loaded in components that need them

  return (
    <>
      {/* Préchargement des ressources critiques pour améliorer FCP */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://api.supabase.co" />
      <link rel="dns-prefetch" href="https://checkout.dodopayments.com" />

      <StructuredData locale={locale} />
      <PrimeReactProvider>
        <QueryProvider>
          <TranslationsProvider locale={locale}>
            <AuthProvider>{children}</AuthProvider>
          </TranslationsProvider>
        </QueryProvider>
      </PrimeReactProvider>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
