import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'validator' | 'viewer'
  company_id: string
  preferences: any
  created_at: string
}

interface Company {
  id: string
  name: string
  type: 'subcontractor' | 'main_contractor' | 'validator'
  subscription_tier: string
  settings: any
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  company: Company | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = async () => {
    try {
      const { user: currentUser, profile: userProfile, company: userCompany } = await authService.getCurrentUser()
      setUser(currentUser)
      setProfile(userProfile)
      setCompany(userCompany)
    } catch (error) {
      console.error('Error loading user data:', error)
      setUser(null)
      setProfile(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load initial auth state
    loadUserData()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await loadUserData()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          await loadUserData()
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await authService.signIn(email, password)
    
    if (!error) {
      // Auth state change listener will handle loading user data
      setTimeout(() => loadUserData(), 100)
    } else {
      setLoading(false)
    }
    
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await authService.signOut()
    
    if (!error) {
      setUser(null)
      setProfile(null)
      setCompany(null)
    }
    
    setLoading(false)
    return { error }
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const value: AuthContextType = {
    user,
    profile,
    company,
    loading,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}