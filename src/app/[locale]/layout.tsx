import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
// import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
import { StructuredData } from '@/components/SEO/StructuredData'
import { AuthProvider } from '@/contexts/AuthContext'
import { locales } from '@/i18n/config'
import '../globals.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  // SEO optimized metadata based on locale
  if (locale === 'fr') {
    return {
      title: "Lalabel - Générateur d'Étiquettes d'Expédition | Impression Amazon, Shopify, eBay",
      description:
        "Créez 10 étiquettes d'expédition gratuites par jour. Compatible Amazon Seller, Shopify, eBay. Premium illimité à 5€/mois. Formats Avery, A4, rouleaux thermiques.",
      keywords:
        'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit',
      openGraph: {
        title: "Lalabel - Générateur d'Étiquettes d'Expédition Gratuit",
        description:
          "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Tous formats : Avery, A4, rouleaux.",
        type: 'website',
        locale: 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title: "Lalabel - Générateur d'Étiquettes d'Expédition",
        description:
          "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Gratuit et sécurisé.",
      },
    }
  } else {
    return {
      title: 'Lalabel - Shipping Label Generator | Print Amazon, Shopify, eBay Labels',
      description:
        'Create 10 free shipping labels daily. Compatible Amazon Seller, Shopify, eBay. Unlimited Premium €5/month. Avery formats, A4, thermal rolls.',
      keywords:
        'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free',
      openGraph: {
        title: 'Lalabel - Free Shipping Label Generator',
        description:
          'Create and print shipping labels from Amazon, Shopify, eBay. All formats: Avery, A4, thermal rolls.',
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Lalabel - Shipping Label Generator',
        description:
          'Create and print shipping labels from Amazon, Shopify, eBay. Free and secure.',
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
    <html lang={locale}>
      <head>
        <StructuredData locale={locale} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PrimeReactProvider>
          <AuthProvider>{children}</AuthProvider>
        </PrimeReactProvider>
      </body>
    </html>
  )
}
