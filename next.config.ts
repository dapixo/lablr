import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Désactiver React StrictMode pour éviter les appels doublés
  reactStrictMode: false,

  // Permettre les requêtes cross-origin depuis ngrok en développement
  allowedDevOrigins: [
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    // Wildcards pour tous les domaines ngrok
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.io',
    '*.ngrok.app',
  ],

  // Headers de sécurité renforcée
  async headers() {
    // En développement, on assouplit les headers pour ngrok
    const isDev = process.env.NODE_ENV !== 'production'

    return [
      {
        // Appliquer à toutes les routes
        source: '/(.*)',
        headers: isDev ? [
          // Headers minimaux en dev pour ngrok
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ] : [
          // Content Security Policy - Protection XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.dodopayments.com https://test.checkout.dodopayments.com https://*.supabase.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://*.dodopayments.com wss://*.supabase.co",
              "frame-src 'self' https://checkout.dodopayments.com https://test.checkout.dodopayments.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // Protection contre le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Protection contre MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Protection XSS intégrée du navigateur
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Forcer HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Contrôler les informations de référent
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Contrôler les permissions du navigateur
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
        ], // Fin des headers production
      },
    ]
  },
}

export default nextConfig
