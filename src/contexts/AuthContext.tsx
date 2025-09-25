'use client'

import type { AuthError, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateEmailDomain, EMAIL_VALIDATION_ERRORS } from '@/lib/disposable-email-domains'
import type { UserPlan } from '@/types/user'

/**
 * Helper pour les logs de debug
 * Active les logs seulement avec ?debug=true
 */
const debugLog = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true') {
    console.log(...args)
  }
}

/**
 * Interface AuthContext - Simple et Clean
 * 🎯 Séparation Auth (session) vs Plan utilisateur (données métier)
 */
interface AuthContextType {
  // 🔐 État d'authentification (session Supabase)
  user: User | null
  loading: boolean
  error: string | null

  // 💰 Plan utilisateur (lazy loading, non-bloquant)
  userPlan: UserPlan
  planLoading: boolean
  planError: string | null

  // 🔧 Actions d'authentification
  sendOtpCode: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtpCode: (email: string, code: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  deleteAccount: () => Promise<{ error: AuthError | null }>
  refreshUserPlan: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider - Architecture Simple et Robuste
 * 🚀 Pattern Supabase standard avec améliorations UX
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // 🔐 État d'authentification (session uniquement)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 💰 État plan utilisateur (séparé, non-bloquant)
  const [userPlan, setUserPlan] = useState<UserPlan>('free')
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  /**
   * Récupère le plan utilisateur de manière non-bloquante
   * 🎯 Lazy loading - ne bloque pas l'authentification
   */
  const fetchUserPlan = useCallback(async (userId: string) => {
    setPlanLoading(true)
    setPlanError(null)

    try {
      debugLog('📡 Fetching user plan for:', userId)

      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Si profil pas trouvé, créer avec plan gratuit
        if (error.code === 'PGRST116') {
          debugLog('📝 Creating new profile with free plan')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ user_id: userId, plan: 'free' })

          if (insertError) {
            throw insertError
          }

          setUserPlan('free')
        } else {
          throw error
        }
      } else {
        const plan = (data?.plan as UserPlan) || 'free'
        debugLog('📋 User plan loaded:', plan)
        setUserPlan(plan)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user plan'
      debugLog('❌ Error fetching user plan:', errorMessage)
      setPlanError(errorMessage)
      // Fallback vers free en cas d'erreur
      setUserPlan('free')
    } finally {
      setPlanLoading(false)
    }
  }, [supabase])

  /**
   * Hook principal d'authentification
   * ✨ Pattern Supabase standard - simple et fiable
   */
  useEffect(() => {
    debugLog('🔄 Setting up auth listener')

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debugLog('🔐 Auth event:', event, 'User:', session?.user?.email || 'none')

        // 🎯 Mise à jour immédiate de l'état d'auth
        const newUser = session?.user || null
        setUser(newUser)
        setLoading(false)
        setError(null)

        // 💰 Chargement du plan en arrière-plan (non-bloquant)
        if (newUser?.id) {
          // Pas d'await - non-bloquant pour l'UX
          fetchUserPlan(newUser.id).catch((err) => {
            debugLog('⚠️ Background plan fetch failed:', err)
          })
        } else {
          // Reset plan si déconnexion
          setUserPlan('free')
          setPlanError(null)
          setPlanLoading(false)
        }
      }
    )

    return () => {
      debugLog('🧹 Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [fetchUserPlan, supabase.auth])

  /**
   * Rafraîchissement manuel du plan utilisateur
   */
  const refreshUserPlan = useCallback(async () => {
    if (!user?.id) {
      debugLog('⚠️ No user to refresh plan for')
      return
    }

    await fetchUserPlan(user.id)
  }, [user?.id, fetchUserPlan])

  /**
   * Helper pour créer une erreur de validation email
   */
  const createValidationError = useCallback((errorCode: keyof typeof EMAIL_VALIDATION_ERRORS): AuthError => ({
    message: EMAIL_VALIDATION_ERRORS[errorCode],
    status: 400,
  } as AuthError), [])

  /**
   * Envoi du code OTP avec validation
   */
  const sendOtpCode = useCallback(async (email: string) => {
    // Reset erreurs précédentes
    setError(null)

    // Validation côté client
    const emailValidation = validateEmailDomain(email)

    if (!emailValidation.isValid) {
      const validationError = createValidationError('INVALID_FORMAT')
      setError(validationError.message)
      return { error: validationError }
    }

    if (emailValidation.isDisposable) {
      const validationError = createValidationError('DISPOSABLE_DOMAIN')
      setError(validationError.message)
      return { error: validationError }
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
      }

      return { error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP code'
      setError(errorMessage)
      return { error: new Error(errorMessage) as AuthError }
    }
  }, [supabase.auth, createValidationError])

  /**
   * Vérification du code OTP
   */
  const verifyOtpCode = useCallback(async (email: string, code: string) => {
    setError(null)

    // Validation côté client
    const emailValidation = validateEmailDomain(email)

    if (!emailValidation.isValid) {
      const validationError = createValidationError('INVALID_FORMAT')
      setError(validationError.message)
      return { error: validationError }
    }

    if (emailValidation.isDisposable) {
      const validationError = createValidationError('DISPOSABLE_DOMAIN')
      setError(validationError.message)
      return { error: validationError }
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })

      if (error) {
        setError(error.message)
      }

      return { error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP code'
      setError(errorMessage)
      return { error: new Error(errorMessage) as AuthError }
    }
  }, [supabase.auth, createValidationError])

  /**
   * Déconnexion
   */
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
      } else {
        // Reset local state
        setError(null)
      }

      return { error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(errorMessage)
      return { error: new Error(errorMessage) as AuthError }
    }
  }, [supabase.auth])

  /**
   * Suppression du compte
   */
  const deleteAccount = useCallback(async () => {
    if (!user?.id) {
      const error = new Error('No user logged in') as AuthError
      setError(error.message)
      return { error }
    }

    try {
      // Appel API pour supprimer le compte
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete account' }))
        const error = new Error(errorData.message) as AuthError
        setError(error.message)
        return { error }
      }

      // Nettoyage côté client
      await supabase.auth.signOut({ scope: 'global' })

      // Force reset local state immédiatement
      setUser(null)
      setUserPlan('free')
      setPlanError(null)
      setPlanLoading(false)
      setError(null)

      // Nettoyage du storage
      if (typeof window !== 'undefined') {
        // localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })

        // sessionStorage
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            sessionStorage.removeItem(key)
          }
        })

        // Cookies
        document.cookie.split(';').forEach(cookie => {
          const cookieName = cookie.trim().split('=')[0]
          if (cookieName.startsWith('sb-') || cookieName.includes('auth-token')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          }
        })
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      setError(errorMessage)
      return { error: new Error(errorMessage) as AuthError }
    }
  }, [user?.id, supabase.auth])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
    setPlanError(null)
  }, [])

  // 🎯 API Context simple et clean
  const value: AuthContextType = {
    // Auth state
    user,
    loading,
    error,

    // Plan state
    userPlan,
    planLoading,
    planError,

    // Actions
    sendOtpCode,
    verifyOtpCode,
    signOut,
    deleteAccount,
    refreshUserPlan,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook pour utiliser l'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}