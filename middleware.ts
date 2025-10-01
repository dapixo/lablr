import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Configuration CORS pour sécuriser les API endpoints
 */
const CORS_CONFIG = {
  // Domaines autorisés en production
  allowedOrigins: [
    'https://lalabel.app',
    'https://www.lalabel.app',
    // En développement, autoriser localhost
    ...(process.env.NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ] : [])
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
  maxAge: 86400, // 24 heures
}

/**
 * Ajoute les headers CORS à une réponse
 */
function addCorsHeaders(response: NextResponse, origin?: string | null) {
  // Vérifier si l'origine est autorisée
  const isAllowedOrigin = origin && CORS_CONFIG.allowedOrigins.includes(origin)

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

/**
 * Gère les requêtes preflight OPTIONS
 */
function handlePreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 200 })

  return addCorsHeaders(response, origin)
}

/**
 * Middleware principal de l'application
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Gérer les requêtes preflight CORS pour les API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return handlePreflight(request)
  }

  // Mettre à jour la session Supabase pour toutes les requêtes
  let response = await updateSession(request)

  // Ajouter les headers CORS pour les API routes
  if (pathname.startsWith('/api/')) {
    response = addCorsHeaders(response, origin)
  }

  // Sécurité supplémentaire pour les API sensibles
  if (pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/api/lemonsqueezy/') ||
      pathname.startsWith('/api/subscription')) {

    // Vérifier le referrer pour les APIs sensibles (protection CSRF)
    const referer = request.headers.get('referer')
    const isValidReferer = !referer || CORS_CONFIG.allowedOrigins.some(
      allowed => referer.startsWith(allowed)
    )

    if (!isValidReferer && request.method !== 'GET') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid referer' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
