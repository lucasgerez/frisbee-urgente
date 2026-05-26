import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isEditorRole } from '../lib/auth'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isEditor: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = async (user: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!error) {
      setProfile((data as Profile | null) ?? null)
      return
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
      setProfile(inserted as Profile)
      return
    }

    setProfile(null)
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      try {
        setSession(data.session)
        if (data.session?.user) {
          await loadProfile(data.session.user)
        } else {
          setProfile(null)
        }
      } catch {
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession)
        if (nextSession?.user) {
          await loadProfile(nextSession.user)
        } else {
          setProfile(null)
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
    setSession(null)
    setProfile(null)
    setIsLoading(false)
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
