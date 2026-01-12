import type { Metadata } from 'next'

/**
 * Layout pour la page Login
 * Métadonnées : noindex/nofollow car page d'authentification
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
