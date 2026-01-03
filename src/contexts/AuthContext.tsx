'use client'

import type { AuthError, User } from '@supabase/supabase-js'
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

  // 🔐 État d'authentification (session uniquement)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 💰 État plan utilisateur (séparé, non-bloquant)
  const [userPlan, setUserPlan] = useState<UserPlan>('free')
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  // 🚀 Cache optimisé avec timestamps pour éviter appels redondants
  const planCacheRef = useRef<Map<string, { plan: UserPlan; timestamp: number }>>(new Map())
  const expirationCheckRef = useRef<Map<string, number>>(new Map()) // Timestamp dernière vérification expiration

  // Cache valide pendant 5 minutes
  const PLAN_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  // Vérifier les expirations max 1 fois toutes les 30 minutes
  const EXPIRATION_CHECK_TTL = 30 * 60 * 1000 // 30 minutes

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
   * Récupère le plan utilisateur de manière non-bloquante
   * 🎯 OPTIMISÉ : Cache intelligent + vérifications expiration en arrière-plan
   */
  const fetchUserPlan = useCallback(
    async (userId: string, forceRefresh = false) => {
      const now = Date.now()

      // ⚡ Vérifier le cache (valide pendant 5 minutes)
      if (!forceRefresh) {
        const cached = planCacheRef.current.get(userId)
        if (cached && now - cached.timestamp < PLAN_CACHE_TTL) {
          debugLog('⚡ Using cached plan for user:', userId)
          setUserPlan(cached.plan)
          setPlanLoading(false)
          return
        }
      }

      setPlanLoading(true)
      setPlanError(null)

      try {
        debugLog('📡 Fetching user plan for:', userId)

        // 🚀 OPTIMISÉ: Vérifier expirations en arrière-plan (non-bloquant)
        // Ne pas attendre la fin, lancer en parallèle
        checkAndCleanExpiredSubscriptions(userId).catch((err) => {
          debugLog('⚠️ Background expiration check failed:', err)
        })

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

          // ⚡ Mettre en cache le plan
          planCacheRef.current.set(userId, { plan, timestamp: now })
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
    },
    [supabase, checkAndCleanExpiredSubscriptions]
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
        // Reset tous les caches
        planCacheRef.current.clear()
        expirationCheckRef.current.clear()
      }
    })

    return () => {
      debugLog('🧹 Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [fetchUserPlan, supabase.auth])

  /**
   * Rafraîchissement manuel du plan utilisateur (force le refresh)
   * ⚡ OPTIMISÉ : Bypass le cache pour forcer un reload complet
   */
  const refreshUserPlan = useCallback(async () => {
    if (!user?.id) {
      debugLog('⚠️ No user to refresh plan for')
      return
    }

    // Forcer le refresh en invalidant les caches
    planCacheRef.current.delete(user.id)
    expirationCheckRef.current.delete(user.id)

    await fetchUserPlan(user.id, true) // forceRefresh = true
  }, [user?.id, fetchUserPlan])

  /**
   * Envoi du code OTP avec validation
   */
  const sendOtpCode = useCallback(
    async (email: string) => {
      // Reset erreurs précédentes
      setError(null)

      // Validation côté client
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
    },
    [supabase.auth]
  )

  /**
   * Vérification du code OTP
   */
  const verifyOtpCode = useCallback(
    async (email: string, code: string) => {
      setError(null)

      // Validation côté client
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
    },
    [supabase.auth]
  )

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
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to delete account' }))
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
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      setError(errorMessage)
      return { error: new Error(errorMessage) as AuthError }
    }
  }, [user?.id, supabase.auth])

  /**
   * Mise à jour du nom utilisateur
   */
  const updateUserName = useCallback(
    async (fullName: string) => {
      if (!user?.id) {
        const error = new Error('No user logged in') as AuthError
        setError(error.message)
        return { error }
      }

      const trimmedName = fullName.trim()

      if (!trimmedName) {
        const error = new Error('Le nom ne peut pas être vide') as AuthError
        setError(error.message)
        return { error }
      }

      // Validation sécurité : longueur max
      if (trimmedName.length > 100) {
        const error = new Error('Le nom ne peut pas dépasser 100 caractères') as AuthError
        setError(error.message)
        return { error }
      }

      // Validation sécurité : caractères autorisés (lettres, espaces, traits d'union, apostrophes)
      const nameRegex = /^[\p{L}\p{M}\s\-'.]+$/u
      if (!nameRegex.test(trimmedName)) {
        const error = new Error('Le nom contient des caractères non autorisés') as AuthError
        setError(error.message)
        return { error }
      }

      // Validation sécurité : pas de caractères de contrôle
      if (/[\x00-\x1F\x7F-\x9F]/.test(trimmedName)) {
        const error = new Error('Le nom contient des caractères invalides') as AuthError
        setError(error.message)
        return { error }
      }

      try {
        // Mise à jour des métadonnées utilisateur Supabase
        const { data, error } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
          },
        })

        if (error) {
          setError(error.message)
          return { error }
        }

        // Mise à jour locale immédiate (l'auth listener se chargera du reste)
        if (data.user) {
          setUser(data.user)
        }

        debugLog('✅ User name updated successfully:', fullName)
        setError(null)
        return { error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update user name'
        setError(errorMessage)
        return { error: new Error(errorMessage) as AuthError }
      }
    },
    [user?.id, supabase.auth]
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
