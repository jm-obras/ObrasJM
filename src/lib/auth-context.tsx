'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { Profile, UserRol } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: {
    id: string
    email: string
    created_at: string
  } | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nombre_completo: string, rol: UserRol) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setProfile(data.profile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch {
      setUser(null)
      setProfile(null)
    }
  }, [])

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      await refreshProfile()
      setLoading(false)
    }
    initAuth()
  }, [refreshProfile])

  // Listen for Supabase auth state changes
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await refreshProfile()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED') {
          await refreshProfile()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { error: data.error || 'Error al iniciar sesión' }
      }

      setUser(data.user)
      setProfile(data.profile)
      return { error: null }
    } catch {
      return { error: 'Error de conexión. Intente nuevamente.' }
    }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    nombre_completo: string,
    rol: UserRol
  ): Promise<{ error: string | null }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre_completo, rol }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { error: data.error || 'Error al registrar usuario' }
      }

      return { error: null }
    } catch {
      return { error: 'Error de conexión. Intente nuevamente.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with local cleanup even if API call fails
    } finally {
      setUser(null)
      setProfile(null)
    }
  }, [])

  const value: AuthState = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
