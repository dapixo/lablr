import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Désactiver React StrictMode pour éviter les appels doublés
  reactStrictMode: false,

  // Headers de sécurité renforcée
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/(.*)',
        headers: [
          // Content Security Policy - Protection XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.lemonsqueezy.com https://*.supabase.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com wss://*.supabase.co",
              "frame-src 'self' https://app.lemonsqueezy.com",
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
        ],
      },
    ]
  },
}

export default nextConfig
