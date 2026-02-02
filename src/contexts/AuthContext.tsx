// src/contexts/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type Role = 'user' | 'staff' | 'admin'

export type Profile = {
  id: string
  role: 'user' | 'staff' | 'admin'
  full_name: string | null
  phone: string | null
  address?: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PROFILE_TIMEOUT_MS = 6000

function promiseWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)

    promise
      .then(res => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/**
 * IMPORTANT:
 * supabase query builder isn't a Promise in TS type system,
 * so we wrap it with Promise.resolve(...) to force a real Promise<T>.
 */
async function fetchProfileWithTimeout(uid: string): Promise<Profile | null> {
  const request = Promise.resolve(
    supabase
      .from('profiles')
      .select('id, role, full_name, phone, created_at')
      .eq('id', uid)
      .maybeSingle()
  )

  const { data, error } = await promiseWithTimeout(request, PROFILE_TIMEOUT_MS, 'fetchProfile')

  if (error) throw error
  return (data as Profile | null) ?? null
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const mountedRef = useRef(true)
  const initRanRef = useRef(false)

  const safeSetUser = (u: User | null) => {
    if (!mountedRef.current) return
    setUser(u)
  }

  const safeSetProfile = (p: Profile | null) => {
    if (!mountedRef.current) return
    setProfile(p)
  }

  const safeSetLoading = (v: boolean) => {
    if (!mountedRef.current) return
    setLoading(v)
  }

  const applySession = useCallback(async (session: Session | null) => {
    const nextUser = session?.user ?? null

    if (!nextUser) {
      safeSetUser(null)
      safeSetProfile(null)
      safeSetLoading(false)
      return
    }

    safeSetUser(nextUser)

    try {
      const prof = await fetchProfileWithTimeout(nextUser.id)
      safeSetProfile(prof)
    } catch (err) {
      console.error('[AuthContext] fetchProfile failed:', err)
      safeSetProfile(null)
    } finally {
      safeSetLoading(false)
    }
  }, [])

  const initAuth = useCallback(async () => {
    if (initRanRef.current) return
    initRanRef.current = true

    safeSetLoading(true)

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      await applySession(data.session ?? null)
    } catch (err) {
      console.error('[AuthContext] initAuth error:', err)
      safeSetUser(null)
      safeSetProfile(null)
      safeSetLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    mountedRef.current = true

    void initAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      mountedRef.current = false
      listener.subscription.unsubscribe()
    }
  }, [initAuth, applySession])

  const login = useCallback(
    async (email: string, password: string) => {
      safeSetLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        safeSetLoading(false)
        throw error
      }

      await applySession(data.session ?? null)
    },
    [applySession]
  )

  const signOut = useCallback(async () => {
    safeSetLoading(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('[AuthContext] signOut error:', error)
    } finally {
      safeSetUser(null)
      safeSetProfile(null)
      safeSetLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return

    safeSetLoading(true)
    try {
      const prof = await fetchProfileWithTimeout(user.id)
      safeSetProfile(prof)
    } catch (err) {
      console.error('[AuthContext] refreshProfile error:', err)
    } finally {
      safeSetLoading(false)
    }
  }, [user])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      login,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, login, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
