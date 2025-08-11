import { supabase } from './supabase-client'
import type { Database } from '../types/database'

// Re-export the client for backward compatibility
export { supabase }

// Simplified authentication service using SSR-compatible client
export const authService = {
  // Get current user (simplified to prevent circular dependencies)
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return { user: null, company: null, profile: null, error }
      }

      // Only return user - let components fetch profile data as needed
      return { user, profile: null, company: null, error: null }
    } catch (error) {
      console.error('Error getting current user:', error)
      return { user: null, company: null, profile: null, error }
    }
  },

  // Separate function to get profile data when needed
  getUserProfile: async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          id, email, name, role, company_id, preferences, created_at,
          companies (
            id, name, type, subscription_tier, settings, created_at, updated_at
          )
        `)
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return { profile: null, company: null, error: profileError }
      }

      return {
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          company_id: profile.company_id,
          preferences: profile.preferences,
          created_at: profile.created_at
        },
        company: profile.companies,
        error: null
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return { profile: null, company: null, error }
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign up (basic user - company registration uses separate flow)
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Email-based password reset
  resetPassword: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      return { data, error }
    } catch (error) {
      console.error('Password reset error:', error)
      return { data: null, error }
    }
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Authentication state change listener
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Company registration
  registerCompany: async (companyData: any, adminUserData: any) => {
    try {
      // First create the admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminUserData.email,
        password: adminUserData.password,
      })

      if (authError || !authData.user) {
        console.error('User registration error:', authError)
        return { data: null, error: authError }
      }

      // Then create company and user profile via API
      const response = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyData,
          adminUser: { ...adminUserData, id: authData.user.id }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Company registration API error:', result)
        return { data: null, error: result.error }
      }

      return {
        data: {
          user: authData.user,
          session: authData.session,
          company: result.company,
          profile: result.user
        },
        error: null
      }

    } catch (error) {
      console.error('Unexpected error during company registration:', error)
      return { data: null, error }
    }
  }
}

// Backward compatibility
export const checkAuth = authService.getCurrentUser

// Helper function for file upload
export const uploadVoiceNote = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('voice-notes')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw error
  }

  return data
}