'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    // onAuthStateChange is the recommended way to manage session state.
    // It fires once immediately with the current session, and then again
    // whenever the auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 