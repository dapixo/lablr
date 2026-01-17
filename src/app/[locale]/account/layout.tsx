import type { Metadata } from 'next'

/**
 * Layout pour la page Account
 * Métadonnées : noindex/nofollow car page privée
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

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
