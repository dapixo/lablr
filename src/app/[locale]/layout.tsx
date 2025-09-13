import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
// import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
import { AuthProvider } from '@/contexts/AuthContext'
import { StructuredData } from '@/components/SEO/StructuredData'
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
        "Créez et imprimez vos étiquettes d'expédition en quelques clics. Compatible Amazon Seller, Shopify, eBay. Formats Avery, A4, rouleaux thermiques. Gratuit et sécurisé.",
      keywords: 'impression étiquettes expédition, générateur étiquettes, imprimer étiquettes adresse, Amazon Seller, Shopify, eBay, étiquettes Avery, A4, gratuit',
      openGraph: {
        title: "Lalabel - Générateur d'Étiquettes d'Expédition Gratuit",
        description: "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Tous formats : Avery, A4, rouleaux. 100% gratuit.",
        type: 'website',
        locale: 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title: "Lalabel - Générateur d'Étiquettes d'Expédition",
        description: "Créez et imprimez vos étiquettes d'expédition depuis Amazon, Shopify, eBay. Gratuit et sécurisé.",
      },
    }
  } else {
    return {
      title: 'Lalabel - Shipping Label Generator | Print Amazon, Shopify, eBay Labels',
      description: 'Create and print shipping labels in seconds. Compatible with Amazon Seller, Shopify, eBay. Avery formats, A4, thermal rolls. Free and secure.',
      keywords: 'shipping label generator, print shipping labels, address labels, Amazon Seller, Shopify, eBay, Avery labels, A4, free',
      openGraph: {
        title: 'Lalabel - Free Shipping Label Generator',
        description: 'Create and print shipping labels from Amazon, Shopify, eBay. All formats: Avery, A4, thermal rolls. 100% free.',
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Lalabel - Shipping Label Generator',
        description: 'Create and print shipping labels from Amazon, Shopify, eBay. Free and secure.',
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
