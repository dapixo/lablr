/**
 * Endpoint pour générer et récupérer le token CSRF
 * GET /api/csrf-token
 */

import { type NextRequest, NextResponse } from 'next/server'
import { refreshCsrfToken, getCsrfTokenFromCookie } from '@/lib/csrf'

/**
 * Génère ou récupère un token CSRF
 * Le token est stocké dans un cookie httpOnly et retourné dans le body
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier si un token existe déjà
    let token = await getCsrfTokenFromCookie()

    // Si pas de token, en générer un nouveau
    if (!token) {
      token = await refreshCsrfToken()
    }

    // Retourner le token au client
    return NextResponse.json({
      csrfToken: token,
    })
  } catch (error) {
    console.error('[CSRF Token] Error generating token:', error)
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 })
  }
}
