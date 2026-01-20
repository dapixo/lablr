import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'optional', // Évite le layout shift si la font n'est pas en cache
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'optional', // Évite le layout shift si la font n'est pas en cache
  preload: true,
  fallback: ['ui-monospace', 'monospace'],
})

export const metadata: Metadata = {
  title: "Lalabel - Générateur d'Étiquettes d'Expédition",
  description: "Créez et imprimez vos étiquettes d'expédition facilement",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
