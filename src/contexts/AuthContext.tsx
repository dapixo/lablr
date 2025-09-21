'use client'

import type { AuthError, Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserPlan } from '@/types/user'

interface AuthContextType {
  user: User | null
  userPlan: UserPlan
  loading: boolean
  sendOtpCode: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtpCode: (email: string, code: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  deleteAccount: () => Promise<{ error: AuthError | null }>
  refreshUserPlan: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Refs pour éviter les problèmes de closure et doubles appels
  const isInitializedRef = useRef(false)
  const currentUserRef = useRef<User | null>(null)

  // Mettre à jour la ref quand l'utilisateur change
  useEffect(() => {
    currentUserRef.current = user
  }, [user])

  /**
   * Récupère le plan utilisateur depuis la base de données
   * @param userId - ID de l'utilisateur
   * @returns Promise<UserPlan> - Plan utilisateur ('free' par défaut)
   */
  const fetchUserPlan = useCallback(async (userId: string): Promise<UserPlan> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Failed to fetch user plan:', error.message)
        return 'free'
      }

      if (!data?.plan) {
        // Profil non trouvé, retourner plan gratuit par défaut
        return 'free'
      }

      return data.plan as UserPlan
    } catch (error: unknown) {
      console.error('Error fetching user plan:', error instanceof Error ? error.message : 'Unknown error')
      return 'free'
    }
  }, [supabase])

  /**
   * Rafraîchit le plan utilisateur depuis la base de données
   */
  const refreshUserPlan = useCallback(async () => {
    if (!user?.id) {
      setUserPlan('free')
      return
    }

    try {
      const plan = await fetchUserPlan(user.id)
      setUserPlan(plan)
    } catch (error) {
      console.error('Error refreshing user plan:', error)
      setUserPlan('free')
    }
  }, [user?.id, fetchUserPlan])

  useEffect(() => {

    /**
     * Gère l'état de l'utilisateur et son plan de manière unifiée
     */
    const handleAuthState = async (session: Session | null) => {
      try {
        setUser(session?.user ?? null)

        if (session?.user) {
          const plan = await fetchUserPlan(session.user.id)
          setUserPlan(plan)
        } else {
          setUserPlan('free')
        }
      } catch (error) {
        console.error('Error handling auth state:', error)
        setUserPlan('free')
      } finally {
        if (!isInitializedRef.current) {
          setLoading(false)
          isInitializedRef.current = true
        }
      }
    }

    // Écouter les changements d'authentification AVANT l'initialisation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Marquer comme initialisé après le premier événement
      if (!isInitializedRef.current && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        await handleAuthState(session)
        isInitializedRef.current = true
        return
      }

      // Éviter le traitement des événements avant l'initialisation
      if (!isInitializedRef.current) {
        return
      }

      // Éviter les traitements redondants pour le même utilisateur
      if (event === 'SIGNED_IN' && session?.user?.id === currentUserRef.current?.id) {
        return
      }

      // Seuls certains événements nécessitent une mise à jour complète
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setLoading(true)
        await handleAuthState(session)
        setLoading(false)
      } else {
        // Pour les autres événements (comme les focus d'onglet), mettre à jour la session
        // mais préserver le plan utilisateur existant si on a toujours le même user
        if (session && session?.user?.id === currentUserRef.current?.id) {
          // Même utilisateur, garder le plan actuel
          setUser(session.user)
        } else {
          // Utilisateur différent ou déconnecté, mise à jour complète
          await handleAuthState(session)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserPlan])

  const sendOtpCode = async (email: string) => {
    // Pour recevoir un code OTP, il faut configurer Supabase pour désactiver
    // les magic links et activer les codes OTP dans le dashboard
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    return { error }
  }

  const verifyOtpCode = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const deleteAccount = async () => {
    if (!user?.id) {
      return { error: new Error('No user logged in') as AuthError }
    }

    try {
      // Call our API route to delete the account
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to delete account' }))
        return {
          error: {
            message: errorData.message || 'Failed to delete account',
            status: response.status,
          } as AuthError,
        }
      }

      // Clear local auth state since account is deleted server-side
      setUser(null)
      return { error: null }
    } catch (error) {
      console.error('Delete account error:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error occurred',
          status: 0,
        } as AuthError,
      }
    }
  }

  const value = {
    user,
    userPlan,
    loading,
    sendOtpCode,
    verifyOtpCode,
    signOut,
    deleteAccount,
    refreshUserPlan,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
