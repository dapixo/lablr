'use client'

import type { AuthError, Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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

  // Ref pour éviter les doubles appels durant l'initialisation
  const isInitializedRef = useRef(false)

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
    const handleAuthState = async (session: Session | null, isInitial = false) => {
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

    /**
     * Récupère la session initiale
     */
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error.message)
          setUser(null)
          setUserPlan('free')
          setLoading(false)
          return
        }

        await handleAuthState(session, true)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setUserPlan('free')
        setLoading(false)
      }
    }

    // Initialiser avec la session actuelle
    initializeAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      // Éviter le traitement redondant lors de l'initialisation
      if (!isInitializedRef.current) {
        return
      }

      // Mettre en loading pendant la mise à jour du plan
      setLoading(true)
      await handleAuthState(session, false)
      setLoading(false)
    })

    return () => {
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
