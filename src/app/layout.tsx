import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { PrimeReactProvider } from 'primereact/api'
import './globals.css'
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

export const metadata: Metadata = {
  title: "Lablr - Extracteur d'adresses Amazon Seller",
  description:
    'Micro SaaS pour extraire et imprimer les adresses de vos rapports Amazon Seller au format TSV.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PrimeReactProvider>{children}</PrimeReactProvider>
      </body>
    </html>
  )
}
