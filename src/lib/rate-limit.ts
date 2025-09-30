/**
 * Système de rate limiting maison
 * Solution simple et efficace avec Map en mémoire
 */

interface RateLimitEntry {
  requests: number[]
  lastCleanup: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Nettoyage automatique toutes les 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }

  /**
   * Vérifie si une clé est rate limitée
   */
  async limit(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now()
    const entry = this.store.get(key) || { requests: [], lastCleanup: now }

    // Nettoyer les anciennes requêtes si nécessaire
    if (now - entry.lastCleanup > windowMs / 2) {
      entry.requests = entry.requests.filter(timestamp => now - timestamp < windowMs)
      entry.lastCleanup = now
    }

    const validRequests = entry.requests.filter(timestamp => now - timestamp < windowMs)
    const success = validRequests.length < maxRequests
    const remaining = Math.max(0, maxRequests - validRequests.length - (success ? 1 : 0))
    const oldestRequest = validRequests[0]
    const resetTime = oldestRequest ? oldestRequest + windowMs : now + windowMs

    if (success) {
      validRequests.push(now)
      entry.requests = validRequests
      this.store.set(key, entry)
    } else {
      entry.requests = validRequests
      this.store.set(key, entry)
    }

    return {
      success,
      remaining,
      reset: new Date(resetTime),
    }
  }

  /**
   * Nettoyage périodique des entrées expirées
   */
  private cleanup() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24h

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastCleanup > maxAge) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Nettoie les ressources
   */
  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Instance singleton
const rateLimiter = new InMemoryRateLimiter()

/**
 * Configurations prédéfinies pour différents types d'endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentification - Protection contre brute force OTP
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 req/minute
  },
  // Usage tracking - Usage normal fréquent
  usage: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 req/minute
  },
  // Subscription management - Opérations moins fréquentes
  subscription: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 req/minute
  },
  // Webhooks - Volume élevé mais légitime
  webhook: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 req/minute
  },
  // Par défaut - Conservateur
  default: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 req/minute
  },
} as const

/**
 * Helper pour extraire l'IP de la requête
 */
export function getClientIP(request: Request): string {
  // Headers possibles pour l'IP client (par ordre de priorité)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')

  // x-forwarded-for peut contenir plusieurs IPs séparées par des virgules
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return realIP || remoteAddr || 'unknown'
}

/**
 * Type des configurations de rate limiting disponibles
 */
export type RateLimiterType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Helper principal pour appliquer le rate limiting
 */
export async function checkRateLimit(request: Request, type: RateLimiterType = 'default'): Promise<{
  success: true;
  headers: Record<string, string>;
} | {
  success: false;
  response: Response;
}> {
  const ip = getClientIP(request)
  const identifier = `${type}:${ip}`
  const config = RATE_LIMIT_CONFIGS[type]

  try {
    const result = await rateLimiter.limit(identifier, config.maxRequests, config.windowMs)

    if (!result.success) {
      const resetTimeSeconds = Math.ceil((result.reset.getTime() - Date.now()) / 1000)

      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Trop de requêtes. Réessayez dans ${resetTimeSeconds} secondes.`,
            retryAfter: resetTimeSeconds,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': resetTimeSeconds.toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.reset.getTime().toString(),
            },
          }
        ),
      }
    }

    // Rate limit OK - retourner headers informatifs
    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.getTime().toString(),
      },
    }
  } catch (error) {
    // En cas d'erreur, permettre la requête mais logger l'erreur
    console.error('Rate limiting error:', error)
    return {
      success: true,
      headers: {},
    }
  }
}

/**
 * Helper pour créer une réponse avec headers de rate limiting
 */
export function withRateLimitHeaders(response: Response, headers: Record<string, string>) {
  const newHeaders = new Headers(response.headers)

  for (const [key, value] of Object.entries(headers)) {
    newHeaders.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}