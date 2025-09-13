import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
// import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { PrimeReactProvider } from 'primereact/api'
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

  // Simple metadata based on locale
  if (locale === 'fr') {
    return {
      title: "Lablr - Extracteur d'adresses Amazon Seller",
      description:
        'Micro SaaS pour extraire et imprimer les adresses de vos rapports Amazon Seller au format TSV.',
    }
  } else {
    return {
      title: 'Lablr - Amazon Seller Address Extractor',
      description: 'Micro SaaS to extract and print addresses from your Amazon Seller TSV reports.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PrimeReactProvider>
          <AuthProvider>{children}</AuthProvider>
        </PrimeReactProvider>
      </body>
    </html>
  )
}
