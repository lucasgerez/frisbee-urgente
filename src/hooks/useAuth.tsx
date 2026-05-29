import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { canManageRole, getUserRole, isAdminRole, isEditorRole } from '../lib/auth'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isEditor: boolean
  isAdmin: boolean
  canManage: boolean
  role: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const authRequestId = useRef(0)

  const clearSignedOutState = (clearCache = true) => {
    authRequestId.current += 1
    setSession(null)
    setProfile(null)
    setIsLoading(false)
    if (clearCache) {
      queryClient.clear()
    }
  }

  const loadProfile = async (user: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!error) {
      return (data as Profile | null) ?? null
    }

    const fallbackName = typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, full_name: fallbackName })
      .select('*')
      .single()

    if (!insertError) {
      return inserted as Profile
    }

    return null
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      try {
        setSession(data.session)
        if (data.session?.user) {
          const requestId = authRequestId.current + 1
          authRequestId.current = requestId
          const loadedProfile = await loadProfile(data.session.user)
          if (isMounted && authRequestId.current === requestId) {
            setProfile(loadedProfile)
          }
        } else {
          clearSignedOutState(false)
        }
      } catch {
        setProfile(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!nextSession?.user) {
        clearSignedOutState()
        return
      }

      const requestId = authRequestId.current + 1
      authRequestId.current = requestId
      try {
        setSession(nextSession)
        const loadedProfile = await loadProfile(nextSession.user)
        if (authRequestId.current === requestId) {
          setProfile(loadedProfile)
        }
      } catch {
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    clearSignedOutState()
    if (error) {
      // Keep user logged out locally even if remote revocation fails.
      console.error('Logout warning:', error.message)
    }
  }

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isEditor: isEditorRole(session),
      isAdmin: isAdminRole(session),
      canManage: canManageRole(session),
      role: getUserRole(session),
      signOut,
    }),
    [session, profile, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
