'use client'

import type { AuthError, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createValidationError } from '@/lib/auth-helpers'
import { debugLog } from '@/lib/debug'
import { validateEmailDomain } from '@/lib/disposable-email-domains'
import { findExpiredSubscriptions, shouldSkipExpirationCheck } from '@/lib/subscription-helpers'
import { createClient } from '@/lib/supabase/client'
import type { UserPlan } from '@/types/user'

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
  updateUserName: (fullName: string) => Promise<{ error: AuthError | null }>
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
  const queryClient = useQueryClient()

  // 🔐 État d'authentification (session uniquement)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 💰 État plan utilisateur (géré par React Query)
  // Note: On garde les états locaux pour compatibilité API, mais la source de vérité est React Query
  const [userPlan, setUserPlan] = useState<UserPlan>('free')
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  // 🚀 OPTIMISÉ: Cache expiration check uniquement (plan caché par React Query avec TTL 12h)
  const expirationCheckRef = useRef<Map<string, number>>(new Map())

  // ⚡ TTL expiration check : 24 heures
  const EXPIRATION_CHECK_TTL = 24 * 60 * 60 * 1000 // 24 heures

  /**
   * 🔧 HELPER : Valide l'email et retourne une erreur si invalide/jetable
   * ⚡ DRY : Évite la duplication de validation dans sendOtpCode et verifyOtpCode
   */
  const validateEmail = useCallback((email: string): { error: AuthError | null } => {
    const emailValidation = validateEmailDomain(email)

    if (!emailValidation.isValid) {
      const validationError = createValidationError('INVALID_FORMAT') as AuthError
      setError(validationError.message)
      return { error: validationError }
    }

    if (emailValidation.isDisposable) {
      const validationError = createValidationError('DISPOSABLE_DOMAIN') as AuthError
      setError(validationError.message)
      return { error: validationError }
    }

    return { error: null }
  }, [])

  /**
   * 🔧 HELPER : Gère les erreurs des opérations auth de manière standardisée
   * ⚡ DRY : Évite la duplication du pattern try/catch + setError
   */
  const handleError = useCallback((err: unknown, defaultMessage: string): AuthError => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage
    setError(errorMessage)
    return new Error(errorMessage) as AuthError
  }, [])

  /**
   * 🔧 HELPER : Crée une erreur simple avec setError
   * ⚡ DRY : Évite la duplication du pattern new Error + setError
   */
  const createError = useCallback((message: string): { error: AuthError } => {
    const error = new Error(message) as AuthError
    setError(error.message)
    return { error }
  }, [])

  /**
   * Vérifie et nettoie automatiquement les abonnements expirés
   * 🎯 OPTIMISÉ : Appelée max 1 fois toutes les 30 minutes par utilisateur
   * ⚡ REFACTORISÉ : Utilise les fonctions pures de subscription-helpers.ts
   */
  const checkAndCleanExpiredSubscriptions = useCallback(
    async (userId: string): Promise<boolean> => {
      const lastCheck = expirationCheckRef.current.get(userId)
      const nowTimestamp = Date.now()

      // ⚡ Utiliser le helper pour vérifier le cache
      if (shouldSkipExpirationCheck(lastCheck, nowTimestamp, EXPIRATION_CHECK_TTL)) {
        debugLog('⚡ Skipping expiration check - checked recently for user:', userId)
        return false
      }

      try {
        debugLog('🔍 Checking for expired subscriptions for user:', userId)
        expirationCheckRef.current.set(userId, nowTimestamp)

        // Récupérer les subscriptions avec ends_at ou grace_period_ends_at
        const { data: subs, error: fetchError } = await supabase
          .from('subscriptions')
          .select('subscription_id, status, ends_at, grace_period_ends_at')
          .eq('user_id', userId)

        if (fetchError) {
          debugLog('❌ Error fetching subscriptions:', fetchError)
          return false
        }

        if (!subs || subs.length === 0) {
          debugLog('✅ No subscriptions found')
          return false
        }

        // ⚡ Utiliser le helper pour trouver toutes les subscriptions expirées
        const expiredSubs = findExpiredSubscriptions(subs, new Date())

        if (expiredSubs.length === 0) {
          debugLog('✅ No expired subscriptions')
          return false
        }

        // Marquer toutes les subscriptions expirées dans la DB
        for (const expiredSub of expiredSubs) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              grace_period_starts_at: null,
              grace_period_ends_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('subscription_id', expiredSub.subscription_id)
        }

        // Rétrograder l'utilisateur
        debugLog(`⬇️ Downgrading user ${userId} to free plan`)

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('user_id', userId)

        if (profileError) {
          debugLog('❌ Error downgrading user:', profileError)
        } else {
          debugLog('✅ User automatically downgraded to free plan')
        }

        return true // Au moins une subscription expirée
      } catch (error) {
        debugLog('❌ Error in checkAndCleanExpiredSubscriptions:', error)
        return false
      }
    },
    [supabase]
  )

  /**
   * Récupère le plan utilisateur via React Query
   * 🚀 OPTIMISÉ : Cache géré par React Query (12h TTL)
   * ⚡ Vérifications expiration en arrière-plan (non-bloquant)
   */
  const fetchUserPlan = useCallback(
    async (userId: string, _forceRefresh = false) => {
      setPlanLoading(true)
      setPlanError(null)

      try {
        debugLog('📡 Fetching user plan via React Query for:', userId)

        // 🚀 OPTIMISÉ: Vérifier expirations en arrière-plan (non-bloquant)
        checkAndCleanExpiredSubscriptions(userId).catch((err) => {
          debugLog('⚠️ Background expiration check failed:', err)
        })

        // ⚡ Utiliser React Query pour le fetch avec cache automatique
        const plan = await queryClient.fetchQuery({
          queryKey: ['userPlan', userId],
          queryFn: async (): Promise<UserPlan> => {
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

                return 'free'
              }
              throw error
            }

            return (data?.plan as UserPlan) || 'free'
          },
          staleTime: 12 * 60 * 60 * 1000, // 12h - Cache plan
        })

        debugLog('📋 User plan loaded:', plan)
        setUserPlan(plan)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user plan'
        debugLog('❌ Error fetching user plan:', errorMessage)
        setPlanError(errorMessage)
        // Fallback vers free en cas d'erreur
        setUserPlan('free')
      } finally {
        setPlanLoading(false)
      }
    },
    [supabase, queryClient, checkAndCleanExpiredSubscriptions]
  )

  /**
   * Hook principal d'authentification
   * ⚡ OPTIMISÉ : Filtre les événements non pertinents pour éviter appels redondants
   */
  useEffect(() => {
    debugLog('🔄 Setting up auth listener')

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog('🔐 Auth event:', event, 'User:', session?.user?.email || 'none')

      // ⚡ Filtrer les événements non pertinents pour éviter appels inutiles
      // TOKEN_REFRESHED ne nécessite pas de recharger le plan
      const shouldFetchPlan =
        event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED'

      // 🎯 Mise à jour immédiate de l'état d'auth
      const newUser = session?.user || null
      setUser(newUser)
      setLoading(false)
      setError(null)

      // 💰 Chargement du plan en arrière-plan (non-bloquant)
      if (newUser?.id && shouldFetchPlan) {
        // Pas d'await - non-bloquant pour l'UX
        fetchUserPlan(newUser.id).catch((err) => {
          debugLog('⚠️ Background plan fetch failed:', err)
        })
      } else if (event === 'SIGNED_OUT') {
        // Reset plan si déconnexion
        setUserPlan('free')
        setPlanError(null)
        setPlanLoading(false)
        // Reset cache expiration et invalider React Query cache
        expirationCheckRef.current.clear()
        queryClient.clear() // Nettoie tous les caches React Query
      }
    })

    return () => {
      debugLog('🧹 Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [fetchUserPlan, supabase.auth, queryClient])

  /**
   * Rafraîchissement manuel du plan utilisateur (force le refresh)
   * ⚡ OPTIMISÉ : Invalide le cache React Query et force un refetch
   */
  const refreshUserPlan = useCallback(async () => {
    if (!user?.id) {
      debugLog('⚠️ No user to refresh plan for')
      return
    }

    debugLog('🔄 Force refresh user plan via React Query for:', user.id)

    // Invalider le cache React Query
    await queryClient.invalidateQueries({
      queryKey: ['userPlan', user.id],
    })

    // Invalider aussi le cache expiration pour forcer un check
    expirationCheckRef.current.delete(user.id)

    // Refetch immédiatement
    await fetchUserPlan(user.id, true)
  }, [user?.id, queryClient, fetchUserPlan])

  /**
   * Envoi du code OTP avec validation
   * ⚡ OPTIMISÉ : Utilise les helpers validateEmail et handleError
   */
  const sendOtpCode = useCallback(
    async (email: string) => {
      setError(null)

      // ⚡ Validation avec helper
      const validation = validateEmail(email)
      if (validation.error) {
        return validation
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
        return { error: handleError(err, 'Failed to send OTP code') }
      }
    },
    [supabase.auth, validateEmail, handleError]
  )

  /**
   * Vérification du code OTP
   * ⚡ OPTIMISÉ : Utilise les helpers validateEmail et handleError
   */
  const verifyOtpCode = useCallback(
    async (email: string, code: string) => {
      setError(null)

      // ⚡ Validation avec helper
      const validation = validateEmail(email)
      if (validation.error) {
        return validation
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
        return { error: handleError(err, 'Failed to verify OTP code') }
      }
    },
    [supabase.auth, validateEmail, handleError]
  )

  /**
   * Déconnexion
   * ⚡ OPTIMISÉ : Utilise le helper handleError
   */
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
      } else {
        setError(null)
      }

      return { error }
    } catch (err) {
      return { error: handleError(err, 'Failed to sign out') }
    }
  }, [supabase.auth, handleError])

  /**
   * Suppression du compte
   * ⚡ OPTIMISÉ : Utilise les helpers createError et handleError
   */
  const deleteAccount = useCallback(async () => {
    if (!user?.id) {
      return createError('No user logged in')
    }

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to delete account' }))
        return createError(errorData.message)
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
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })

        // sessionStorage
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            sessionStorage.removeItem(key)
          }
        })

        // Cookies
        document.cookie.split(';').forEach((cookie) => {
          const cookieName = cookie.trim().split('=')[0]
          if (cookieName.startsWith('sb-') || cookieName.includes('auth-token')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          }
        })
      }

      return { error: null }
    } catch (err) {
      return { error: handleError(err, 'Network error occurred') }
    }
  }, [user?.id, supabase.auth, createError, handleError])

  /**
   * Mise à jour du nom utilisateur
   * ⚡ OPTIMISÉ : Utilise les helpers createError et handleError
   */
  const updateUserName = useCallback(
    async (fullName: string) => {
      if (!user?.id) {
        return createError('No user logged in')
      }

      const trimmedName = fullName.trim()

      // Validations avec helper createError
      if (!trimmedName) {
        return createError('Le nom ne peut pas être vide')
      }

      if (trimmedName.length > 100) {
        return createError('Le nom ne peut pas dépasser 100 caractères')
      }

      // Validation sécurité : caractères autorisés (lettres, espaces, traits d'union, apostrophes)
      const nameRegex = /^[\p{L}\p{M}\s\-'.]+$/u
      if (!nameRegex.test(trimmedName)) {
        return createError('Le nom contient des caractères non autorisés')
      }

      // Validation sécurité : pas de caractères de contrôle
      if (/[\x00-\x1F\x7F-\x9F]/.test(trimmedName)) {
        return createError('Le nom contient des caractères invalides')
      }

      try {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
          },
        })

        if (error) {
          setError(error.message)
          return { error }
        }

        // Mise à jour locale immédiate
        if (data.user) {
          setUser(data.user)
        }

        debugLog('✅ User name updated successfully:', fullName)
        setError(null)
        return { error: null }
      } catch (err) {
        return { error: handleError(err, 'Failed to update user name') }
      }
    },
    [user?.id, supabase.auth, createError, handleError]
  )

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
    updateUserName,
    refreshUserPlan,
    clearError,
  }

  // ✨ ANTI-FOUC: Bloquer le rendu tant que l'authentification initiale n'est pas vérifiée
  // Cela évite le "flash" du skeleton pendant la vérification de session
  if (loading) {
    // Note: Le spinner est déjà géré par TranslationsProvider, on retourne null
    // pour éviter de doubler les spinners
    return null
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
