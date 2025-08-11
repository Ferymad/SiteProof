import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, supabase } from '@/lib/supabase'
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
      // First, just check if we have a user from Supabase Auth
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !currentUser) {
        console.log('No authenticated user found:', authError)
        setUser(null)
        setProfile(null)
        setCompany(null)
        setLoading(false)
        return
      }

      // Set user immediately - this allows UI to show authenticated state
      setUser(currentUser)

      // Prevent circular dependencies by not loading profile on auth pages
      const currentPath = window.location.pathname
      const skipProfilePaths = [
        '/auth/',
        '/register/',
        '/_next/',
        '/api/'
      ]
      
      const shouldSkipProfile = skipProfilePaths.some(path => currentPath.includes(path))
      
      if (shouldSkipProfile) {
        // Don't try to load profile data on auth pages to prevent middleware loops
        setProfile(null)
        setCompany(null)
        setLoading(false)
        return
      }

      // Load profile data only for dashboard and protected pages
      try {
        const { profile, company, error: profileError } = await authService.getUserProfile(currentUser.id)

        if (profileError) {
          console.error('Error loading user profile:', profileError)
          setProfile(null)
          setCompany(null)
        } else {
          setProfile(profile)
          // Handle company data from join query - could be array or single object
          if (Array.isArray(company) && company.length > 0) {
            setCompany(company[0] as Company)
          } else if (company && !Array.isArray(company)) {
            setCompany(company as Company)
          } else {
            setCompany(null)
          }
        }
      } catch (profileError) {
        console.error('Profile fetch error:', profileError)
        setProfile(null)
        setCompany(null)
      }
      
    } catch (error) {
      console.error('Error in loadUserData:', error)
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