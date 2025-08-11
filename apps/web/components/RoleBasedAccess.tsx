import { ReactNode, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type UserRole = 'admin' | 'pm' | 'validator' | 'viewer'

interface RoleBasedAccessProps {
  allowedRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
  userRole?: UserRole
}

interface UseRoleReturn {
  role: UserRole | null
  loading: boolean
  hasRole: (roles: UserRole[]) => boolean
  isAdmin: boolean
  isPM: boolean
  isValidator: boolean
  isViewer: boolean
}

// Hook for role-based logic
export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setRole(profile.role as UserRole)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasRole = (roles: UserRole[]) => {
    return role ? roles.includes(role) : false
  }

  return {
    role,
    loading,
    hasRole,
    isAdmin: role === 'admin',
    isPM: role === 'pm',
    isValidator: role === 'validator',
    isViewer: role === 'viewer'
  }
}

// Component for conditional rendering based on roles
export default function RoleBasedAccess({ 
  allowedRoles, 
  children, 
  fallback = null, 
  userRole 
}: RoleBasedAccessProps) {
  const { role, loading } = useRole()

  // Use passed userRole if provided, otherwise use hook
  const currentRole = userRole || role

  if (loading) {
    return <>{fallback}</>
  }

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Higher-order component for page-level role protection
export function withRoleProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  const RoleProtectedComponent = (props: P) => {
    const { role, loading } = useRole()

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
        </div>
      )
    }

    if (!role || !allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  RoleProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return RoleProtectedComponent
}

// Permission definitions for different features
export const PERMISSIONS = {
  // Company management
  MANAGE_COMPANY: ['admin'],
  MANAGE_USERS: ['admin'],
  VIEW_COMPANY_SETTINGS: ['admin'],
  
  // Project management
  CREATE_PROJECTS: ['admin', 'pm'],
  MANAGE_PROJECTS: ['admin', 'pm'],
  VIEW_PROJECTS: ['admin', 'pm', 'validator', 'viewer'],
  
  // Submissions and evidence
  CREATE_SUBMISSIONS: ['admin', 'pm', 'validator'],
  EDIT_SUBMISSIONS: ['admin', 'pm'],
  DELETE_SUBMISSIONS: ['admin', 'pm'],
  VIEW_SUBMISSIONS: ['admin', 'pm', 'validator', 'viewer'],
  
  // Validation
  VALIDATE_EVIDENCE: ['admin', 'validator'],
  APPROVE_VALIDATIONS: ['admin'],
  
  // Reports and analytics
  VIEW_REPORTS: ['admin', 'pm'],
  EXPORT_DATA: ['admin', 'pm'],
  
  // User profile
  EDIT_OWN_PROFILE: ['admin', 'pm', 'validator', 'viewer'],
  VIEW_USER_PROFILES: ['admin', 'pm']
} as const

// Helper function to check specific permissions
export function hasPermission(userRole: UserRole | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!userRole) return false
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole)
}