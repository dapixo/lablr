/**
 * Protection CSRF (Cross-Site Request Forgery)
 * Système de tokens pour sécuriser les routes API sensibles
 *
 * 🔒 SÉCURITÉ : Utilise le double-submit cookie pattern
 * - Token généré côté serveur avec crypto.randomUUID()
 * - Token stocké dans cookie httpOnly + header personnalisé
 * - Validation côté serveur pour chaque requête POST/PUT/DELETE
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// ================================================================
// CONSTANTES
// ================================================================

/** Nom du cookie contenant le token CSRF */
const CSRF_COOKIE_NAME = 'lablr_csrf_token'

/** Nom du header HTTP contenant le token CSRF */
const CSRF_HEADER_NAME = 'x-csrf-token'

/** Durée de vie du token CSRF (1 heure) */
const CSRF_TOKEN_MAX_AGE = 60 * 60 // 1 heure en secondes

/** Routes protégées par CSRF (patterns regex) */
const PROTECTED_ROUTES = [
  /^\/api\/subscription/,
  /^\/api\/dodopayments\/portal/,
  /^\/api\/usage/,
  /^\/api\/auth\/delete/,
]

// ================================================================
// GÉNÉRATION ET VALIDATION
// ================================================================

/**
 * Génère un token CSRF sécurisé
 * Utilise crypto.randomUUID() pour garantir l'unicité
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}

/**
 * Définit le token CSRF dans un cookie httpOnly
 * @param token Token CSRF à stocker
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true, // Pas accessible via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    sameSite: 'lax', // Protection CSRF de base
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  })
}

/**
 * Récupère le token CSRF depuis le cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(CSRF_COOKIE_NAME)
  return cookie?.value || null
}

/**
 * Récupère le token CSRF depuis le header de la requête
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME)
}

/**
 * Vérifie si une route doit être protégée par CSRF
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((pattern) => pattern.test(pathname))
}

/**
 * Valide le token CSRF pour une requête
 * @returns true si le token est valide, false sinon
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieToken = await getCsrfTokenFromCookie()
  const headerToken = getCsrfTokenFromHeader(request)

  // Les deux tokens doivent exister
  if (!cookieToken || !headerToken) {
    console.error('[CSRF] Missing token - cookie:', !!cookieToken, 'header:', !!headerToken)
    return false
  }

  // Les deux tokens doivent correspondre (double-submit pattern)
  if (cookieToken !== headerToken) {
    console.error('[CSRF] Token mismatch')
    return false
  }

  return true
}

// ================================================================
// MIDDLEWARE CSRF
// ================================================================

/**
 * Middleware de protection CSRF
 * À appeler au début des routes API protégées
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = new URL(request.url)

  // Ignorer les méthodes GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }

  // Vérifier si la route est protégée
  if (!isProtectedRoute(pathname)) {
    return null
  }

  // Valider le token CSRF
  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    console.error(`[CSRF] Blocked request to ${pathname} - Invalid token`)
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        message: 'Invalid or missing CSRF token',
      },
      { status: 403 }
    )
  }

  // Token valide, continuer
  return null
}

// ================================================================
// HELPER : GÉNÉRER ET STOCKER TOKEN
// ================================================================

/**
 * Génère un nouveau token CSRF et le stocke dans un cookie
 * À appeler lors de l'authentification ou au chargement initial
 */
export async function refreshCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  await setCsrfCookie(token)
  return token
}

// ================================================================
// HELPER : RÉPONSE AVEC TOKEN CSRF
// ================================================================

/**
 * Ajoute un token CSRF à une réponse API
 * Utile pour les endpoints qui retournent des données sensibles
 */
export async function withCsrfToken(response: NextResponse): Promise<NextResponse> {
  const token = await getCsrfTokenFromCookie()

  // Si pas de token, en générer un nouveau
  if (!token) {
    const newToken = await refreshCsrfToken()
    response.headers.set(CSRF_HEADER_NAME, newToken)
  } else {
    response.headers.set(CSRF_HEADER_NAME, token)
  }

  return response
}

// ================================================================
// EXEMPTION CSRF (pour webhooks)
// ================================================================

/** Routes exemptées de la protection CSRF (webhooks, etc.) */
const CSRF_EXEMPT_ROUTES = [
  /^\/api\/dodopayments\/webhook/, // Webhook Dodo (vérifié par signature)
  /^\/api\/dodopayments\/checkout/, // Checkout (vérifié par referer custom)
]

/**
 * Vérifie si une route est exemptée de la protection CSRF
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((pattern) => pattern.test(pathname))
}
