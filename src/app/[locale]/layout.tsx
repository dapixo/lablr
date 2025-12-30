import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { StructuredData } from '@/components/SEO/StructuredData'
import { AuthProvider } from '@/contexts/AuthContext'
import { locales } from '@/i18n/config'

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
        "Imprimez jusqu'à 5 étiquettes d'expédition gratuitement par impression. Compatible Amazon Seller, Shopify, eBay. Premium illimité à 6€/mois. Formats Avery, A4, rouleaux thermiques.",
      keywords:
        'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit',
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          'fr': `${baseUrl}/fr`,
          'en': `${baseUrl}/en`,
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
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '32x32' },
          { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
          { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    }
  } else {
    return {
      title: 'Lalabel - Shipping Label Generator | Print Amazon, Shopify, eBay Labels',
      description:
        'Create 10 free shipping labels daily. Compatible Amazon Seller, Shopify, eBay. Unlimited Premium €6/month. Avery formats, A4, thermal rolls.',
      keywords:
        'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free',
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          'fr': `${baseUrl}/fr`,
          'en': `${baseUrl}/en`,
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
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '32x32' },
          { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
          { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
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
      <link rel="dns-prefetch" href="https://api.lemonsqueezy.com" />

      <StructuredData locale={locale} />
      <PrimeReactProvider>
        <AuthProvider>{children}</AuthProvider>
      </PrimeReactProvider>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
