import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
import { StructuredData } from '@/components/SEO/StructuredData'
import { AuthProvider } from '@/contexts/AuthContext'
import { TranslationsProvider } from '@/contexts/TranslationsContext'
import { locales, type Locale } from '@/i18n/config'
import { QueryProvider } from '@/providers/QueryProvider'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = 'https://lalabel.app'

  // Configuration icons commune à toutes les locales
  const icons = {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  }

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
            url: `${baseUrl}/og-image.png`,
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
        images: [`${baseUrl}/og-image.png`],
      },
      manifest: '/manifest.json',
      icons,
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
            url: `${baseUrl}/og-image.png`,
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
        images: [`${baseUrl}/og-image.png`],
      },
      manifest: '/manifest.json',
      icons,
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
            url: `${baseUrl}/og-image.png`,
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
        images: [`${baseUrl}/og-image.png`],
      },
      manifest: '/manifest.json',
      icons,
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
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Messages will be loaded in components that need them

  return (
    <>
      {/* Préchargement des ressources critiques pour améliorer FCP et réduire CLS */}
      <link
        rel="preload"
        href="/_next/static/media/primeicons.55fa2301.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://api.supabase.co" />
      <link rel="dns-prefetch" href="https://checkout.dodopayments.com" />

      {/* ⚡ OPTIMISATION Phase 3: Critical CSS inline pour LCP (H1 hero) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS pour l'élément LCP (H1 hero) */
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .font-bold { font-weight: 700; }
            .leading-tight { line-height: 1.25; }
            .mb-6 { margin-bottom: 1.5rem; }
            .text-gray-900 { color: rgb(17 24 39); }
            .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-to: rgb(37 99 235 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
            .to-blue-400 { --tw-gradient-to: #60a5fa; }
            .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
            .text-transparent { color: transparent; }
            @media (min-width: 768px) {
              .md\\:text-5xl { font-size: 3rem; line-height: 1; }
            }
            @media (min-width: 1024px) {
              .lg\\:text-6xl { font-size: 3.75rem; line-height: 1; }
            }
          `,
        }}
      />

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
