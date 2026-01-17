/**
 * Proxy Next.js pour sécurité HTTP et gestion de session
 * - HTTP Security Headers (XSS, Clickjacking, MIME sniffing)
 * - Content Security Policy (CSP)
 * - Protection CSRF pour routes sensibles
 * - Session Supabase via middleware
 */

import type { NextRequest, NextResponse } from 'next/server'
import { csrfProtection, isCsrfExempt } from '@/lib/csrf'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Configuration CSP (Content Security Policy)
 * Protège contre les attaques XSS et injection de code malveillant
 */
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://checkout.dodopayments.com https://test.checkout.dodopayments.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.supabase.co https://*.dodopayments.com wss://*.supabase.co;
  frame-src 'self' https://checkout.dodopayments.com https://test.checkout.dodopayments.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim()

/**
 * Proxy principal Next.js
 * Exécuté pour chaque requête
 */
export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // 1. Protection CSRF (sauf routes exemptées comme webhooks)
  if (!isCsrfExempt(pathname)) {
    const csrfResponse = await csrfProtection(request)
    if (csrfResponse) {
      return csrfResponse
    }
  }

  // 2. Gérer la session Supabase (IMPORTANT : AVANT les headers de sécurité)
  const response = await updateSession(request)

  // 3. Ajouter les headers de sécurité HTTP
  addSecurityHeaders(response, request)

  return response
}

/**
 * Ajoute les headers de sécurité HTTP à la réponse
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest) {
  // ================================================================
  // PROTECTION XSS ET INJECTION
  // ================================================================

  // Content Security Policy (CSP)
  response.headers.set('Content-Security-Policy', CSP_HEADER)

  // Empêcher le navigateur de deviner le MIME type
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Protection XSS intégrée du navigateur (legacy, mais garde pour vieux browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // ================================================================
  // PROTECTION CLICKJACKING
  // ================================================================

  // Empêcher l'intégration dans une iframe (protection clickjacking)
  response.headers.set('X-Frame-Options', 'DENY')

  // ================================================================
  // HTTPS ET TRANSPORT SÉCURISÉ
  // ================================================================

  // Force HTTPS pendant 1 an (31536000 secondes)
  // includeSubDomains : applique aussi aux sous-domaines
  // preload : permet l'inclusion dans la liste HSTS des navigateurs
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // ================================================================
  // PROTECTION DONNÉES SENSIBLES
  // ================================================================

  // Empêcher le navigateur d'envoyer le Referer vers d'autres sites
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy (remplace Feature-Policy)
  // Désactive les APIs sensibles par défaut
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // ================================================================
  // PROTECTION CONTRE LE CACHING DE DONNÉES SENSIBLES
  // ================================================================

  // Pour les routes API sensibles, empêcher le cache
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
}

/**
 * Configuration du matcher
 * Définit les routes où le middleware est exécuté
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - fichiers publics (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
