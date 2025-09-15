'use client'

import type { AuthError, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserPlan } from '@/types/user'

interface AuthContextType {
  user: User | null
  userPlan: UserPlan
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
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

  /**
   * Récupère le plan utilisateur depuis la base de données avec timeout
   * @param userId - ID de l'utilisateur
   * @returns Promise<UserPlan> - Plan utilisateur ('free' par défaut)
   */
  const fetchUserPlan = useCallback(async (userId: string): Promise<UserPlan> => {
    const TIMEOUT_MS = 2000 // 2 secondes - plus raisonnable que 1s

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('fetchUserPlan: Timeout après', TIMEOUT_MS, 'ms - plan par défaut: free')
        resolve('free')
      }, TIMEOUT_MS)

      const fetchData = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('plan')
            .eq('user_id', userId)
            .single()

          clearTimeout(timeout)

          if (error) {
            console.error('fetchUserPlan: Erreur lors de la récupération du plan:', error.message)
            resolve('free')
            return
          }

          if (!data?.plan) {
            console.warn('fetchUserPlan: Aucun profil trouvé pour l\'utilisateur:', userId)
            resolve('free')
            return
          }

          resolve(data.plan as UserPlan)
        } catch (error: unknown) {
          clearTimeout(timeout)
          console.error('fetchUserPlan: Exception:', error instanceof Error ? error.message : 'Unknown error')
          resolve('free')
        }
      }

      fetchData()
    })
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
      console.error('refreshUserPlan: Erreur lors du rafraîchissement:', error)
      setUserPlan('free')
    }
  }, [user?.id, fetchUserPlan])

  useEffect(() => {
    const MAX_LOADING_TIME = 5000 // 5 secondes maximum

    // Timeout de sécurité pour éviter le loading infini
    const loadingTimeout = setTimeout(() => {
      console.warn('AuthContext: Timeout de chargement atteint -', MAX_LOADING_TIME, 'ms')
      setLoading(false)
    }, MAX_LOADING_TIME)

    /**
     * Récupère la session initiale et configure l'utilisateur
     */
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('AuthContext: Erreur lors de la récupération de session:', error.message)
          setUser(null)
          setUserPlan('free')
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          const plan = await fetchUserPlan(session.user.id)
          setUserPlan(plan)
        } else {
          setUserPlan('free')
        }
      } catch (error) {
        console.error('AuthContext: Exception lors de l\'initialisation:', error)
        setUser(null)
        setUserPlan('free')
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    initializeAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null)

        if (session?.user) {
          const plan = await fetchUserPlan(session.user.id)
          setUserPlan(plan)
        } else {
          setUserPlan('free')
        }
      } catch (error) {
        console.error('AuthContext: Erreur lors du changement d\'état:', error)
        setUserPlan('free')
      } finally {
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserPlan])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
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
    signIn,
    signUp,
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
