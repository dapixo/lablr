/**
 * Module de sanitisation des erreurs
 * Empêche l'exposition de détails techniques sensibles aux utilisateurs
 *
 * 🔒 SÉCURITÉ : Ne jamais exposer :
 * - Structure de la base de données (noms de colonnes, tables, contraintes)
 * - Messages d'erreur SQL bruts
 * - Stack traces
 * - Variables d'environnement
 * - Chemins de fichiers
 */

// ================================================================
// MESSAGES D'ERREUR GÉNÉRIQUES POUR L'UTILISATEUR
// ================================================================

export const SANITIZED_ERRORS = {
  // Erreurs génériques
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  DATABASE_ERROR: 'Unable to process your request. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',

  // Erreurs d'authentification
  AUTH_REQUIRED: 'Authentication required. Please log in.',
  AUTH_INVALID: 'Invalid credentials. Please try again.',
  AUTH_EXPIRED: 'Your session has expired. Please log in again.',
  SESSION_ERROR: 'Session error. Please log in again.',

  // Erreurs de validation
  INVALID_INPUT: 'Invalid input. Please check your data and try again.',
  MISSING_FIELD: 'Required field is missing.',
  INVALID_FORMAT: 'Invalid format. Please check your input.',

  // Erreurs de permission
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  FORBIDDEN: 'Access forbidden.',

  // Erreurs de ressources
  NOT_FOUND: 'Resource not found.',
  ALREADY_EXISTS: 'Resource already exists.',
  CONFLICT: 'Conflict detected. Please refresh and try again.',

  // Erreurs de paiement
  PAYMENT_ERROR: 'Payment processing error. Please try again or contact support.',
  SUBSCRIPTION_ERROR: 'Unable to process subscription. Please contact support.',

  // Erreurs de limite
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  QUOTA_EXCEEDED: 'Usage limit exceeded.',

  // Erreurs de webhook
  WEBHOOK_ERROR: 'Webhook processing error.',
  SIGNATURE_INVALID: 'Invalid signature.',
} as const

// ================================================================
// PATTERNS D'ERREURS À SANITISER
// ================================================================

/** Patterns d'erreurs qui révèlent la structure DB */
const DB_ERROR_PATTERNS = [
  /column "([^"]+)" does not exist/i,
  /table "([^"]+)" does not exist/i,
  /relation "([^"]+)" does not exist/i,
  /constraint "([^"]+)" violated/i,
  /foreign key constraint/i,
  /unique constraint/i,
  /check constraint/i,
  /violates/i,
  /duplicate key value/i,
  /null value in column/i,
]

/** Patterns de stack traces */
const STACK_TRACE_PATTERNS = [
  /at\s+[\w.]+\s+\([^)]+:\d+:\d+\)/,
  /Error:\s+.+\n\s+at/,
  /^\s+at\s/m,
]

/** Patterns de chemins de fichiers */
const FILE_PATH_PATTERNS = [
  /\/[\w/-]+\.(ts|js|tsx|jsx|sql)/i,
  /[A-Z]:\\[\w\\-]+\.(ts|js|tsx|jsx|sql)/i,
]

// ================================================================
// TYPES
// ================================================================

export interface SanitizedError {
  message: string
  code?: string
  statusCode: number
}

export interface ErrorContext {
  operation?: string
  userId?: string
  timestamp?: string
}

// ================================================================
// FONCTIONS PRINCIPALES
// ================================================================

/**
 * Sanitise une erreur pour l'affichage utilisateur
 * @param error Erreur brute (Error, string, unknown)
 * @param defaultMessage Message par défaut si non reconnu
 * @returns Message sanitisé sécurisé
 */
export function sanitizeError(
  error: unknown,
  defaultMessage: string = SANITIZED_ERRORS.INTERNAL_ERROR
): string {
  // Cas 1: null ou undefined
  if (error == null) {
    return defaultMessage
  }

  // Cas 2: Erreur Supabase avec code
  if (isSupabaseError(error)) {
    return sanitizeSupabaseError(error)
  }

  // Cas 3: Erreur standard avec message
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message)
  }

  // Cas 4: String directe
  if (typeof error === 'string') {
    return sanitizeErrorMessage(error)
  }

  // Cas 5: Objet avec propriété message
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return sanitizeErrorMessage(error.message)
  }

  // Par défaut
  return defaultMessage
}

/**
 * Sanitise un message d'erreur brut
 * @param message Message brut potentiellement dangereux
 * @returns Message sanitisé
 */
function sanitizeErrorMessage(message: string): string {
  // Vérifier les patterns de base de données
  for (const pattern of DB_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return SANITIZED_ERRORS.DATABASE_ERROR
    }
  }

  // Vérifier les stack traces
  for (const pattern of STACK_TRACE_PATTERNS) {
    if (pattern.test(message)) {
      return SANITIZED_ERRORS.INTERNAL_ERROR
    }
  }

  // Vérifier les chemins de fichiers
  for (const pattern of FILE_PATH_PATTERNS) {
    if (pattern.test(message)) {
      return SANITIZED_ERRORS.INTERNAL_ERROR
    }
  }

  // Si le message semble safe (pas de patterns dangereux), le retourner
  // Sinon, retourner un message générique
  if (isSafeMessage(message)) {
    return message
  }

  return SANITIZED_ERRORS.INTERNAL_ERROR
}

/**
 * Sanitise une erreur Supabase
 */
function sanitizeSupabaseError(error: SupabaseError): string {
  const code = error.code

  // Codes Supabase connus
  switch (code) {
    case '23505': // Unique constraint violation
      return SANITIZED_ERRORS.ALREADY_EXISTS
    case '23503': // Foreign key violation
      return SANITIZED_ERRORS.CONFLICT
    case '23502': // Not null violation
      return SANITIZED_ERRORS.INVALID_INPUT
    case '42501': // Insufficient privilege
      return SANITIZED_ERRORS.UNAUTHORIZED
    case '42P01': // Undefined table
      return SANITIZED_ERRORS.DATABASE_ERROR
    case '42703': // Undefined column
      return SANITIZED_ERRORS.DATABASE_ERROR
    case 'PGRST116': // Not found
      return SANITIZED_ERRORS.NOT_FOUND
    case 'PGRST301': // Row not found
      return SANITIZED_ERRORS.NOT_FOUND
    default:
      // Si code inconnu, ne pas exposer le message brut
      return SANITIZED_ERRORS.DATABASE_ERROR
  }
}

/**
 * Vérifie si un message est safe à afficher
 */
function isSafeMessage(message: string): boolean {
  // Liste de messages qui sont OK à afficher
  const safeMessages = [
    'Unauthorized',
    'Not found',
    'Invalid input',
    'Authentication required',
    'Permission denied',
    'Rate limited',
    'Already exists',
  ]

  // Si le message est dans la liste safe OU est très court et sans patterns dangereux
  if (safeMessages.some((safe) => message.includes(safe))) {
    return true
  }

  // Si le message est court (<50 chars) et ne contient que des mots/espaces
  if (message.length < 50 && /^[a-zA-Z0-9\s.,'!?-]+$/.test(message)) {
    return true
  }

  return false
}

/**
 * Type guard pour les erreurs Supabase
 */
function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}

// ================================================================
// TYPES INTERNES
// ================================================================

interface SupabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

// ================================================================
// LOGGING SÉCURISÉ
// ================================================================

/**
 * Log une erreur de manière sécurisée (côté serveur uniquement)
 * @param error Erreur à logger
 * @param context Contexte additionnel
 */
export function logErrorSecurely(error: unknown, context?: ErrorContext): void {
  // ⚠️ IMPORTANT : Cette fonction ne doit être appelée que côté serveur
  // Ne jamais logger d'erreurs détaillées côté client

  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  // Log structuré pour faciliter le monitoring
  console.error('[ERROR]', {
    timestamp,
    message: errorMessage,
    stack: stack?.split('\n').slice(0, 5).join('\n'), // Limite à 5 lignes
    context,
  })
}

// ================================================================
// HELPER : CRÉER RÉPONSE ERREUR SANITISÉE
// ================================================================

/**
 * Crée un objet de réponse d'erreur sanitisée
 * @param error Erreur brute
 * @param statusCode Code HTTP (défaut: 500)
 * @param context Contexte pour logging serveur
 * @returns Objet SanitizedError
 */
export function createSanitizedErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: ErrorContext
): SanitizedError {
  // Logger l'erreur détaillée côté serveur
  logErrorSecurely(error, context)

  // Retourner une réponse sanitisée
  return {
    message: sanitizeError(error),
    statusCode,
  }
}
