import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export type UserRole = 'admin' | 'pm' | 'validator' | 'viewer'

export interface UserContext {
  id: string
  role: UserRole
  company_id: string
  email?: string
  name?: string
}

// Server-side permission definitions
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
  VIEW_USER_PROFILES: ['admin', 'pm'],

  // API specific permissions
  API_SUBMISSIONS_READ: ['admin', 'pm', 'validator', 'viewer'],
  API_SUBMISSIONS_WRITE: ['admin', 'pm', 'validator'],
  API_COMPANY_READ: ['admin'],
  API_COMPANY_WRITE: ['admin'],
  API_USERS_READ: ['admin'],
  API_USERS_WRITE: ['admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Get authenticated user context from authorization token
 */
export async function getUserContext(token: string): Promise<UserContext | null> {
  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return null
    }

    // Get user profile with role and company
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, company_id, email, name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      id: profile.id,
      role: profile.role as UserRole,
      company_id: profile.company_id,
      email: profile.email,
      name: profile.name
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole)
}

/**
 * Authorize user for a specific permission
 */
export function authorize(userContext: UserContext | null, permission: Permission): boolean {
  if (!userContext) {
    return false
  }
  return hasPermission(userContext.role, permission)
}

/**
 * Middleware function for API route protection
 */
export async function requirePermission(token: string, permission: Permission): Promise<UserContext> {
  const userContext = await getUserContext(token)
  
  if (!userContext) {
    throw new Error('Authentication required')
  }

  if (!authorize(userContext, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`)
  }

  return userContext
}

/**
 * Check if user can access resource belonging to their company
 */
export function canAccessCompanyResource(userContext: UserContext, resourceCompanyId: string): boolean {
  return userContext.company_id === resourceCompanyId
}

/**
 * Check if user can modify resource (belongs to their company and has edit permission)
 */
export function canModifyResource(
  userContext: UserContext, 
  resourceCompanyId: string, 
  permission: Permission
): boolean {
  return canAccessCompanyResource(userContext, resourceCompanyId) && 
         hasPermission(userContext.role, permission)
}

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'pm', 'validator', 'viewer'], // Admin inherits all permissions
  pm: ['pm', 'validator', 'viewer'], // PM inherits validator and viewer permissions
  validator: ['validator', 'viewer'], // Validator inherits viewer permissions
  viewer: ['viewer'] // Viewer has only their own permissions
}

/**
 * Check permission with role inheritance
 */
export function hasPermissionWithInheritance(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  const inheritedRoles = ROLE_HIERARCHY[userRole]
  
  return allowedRoles.some(role => inheritedRoles.includes(role))
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole: UserRole): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter(permission => 
    hasPermissionWithInheritance(userRole, permission)
  )
}

/**
 * API response helper for permission errors
 */
export function createPermissionErrorResponse(message?: string) {
  return {
    error: message || 'Insufficient permissions',
    code: 'PERMISSION_DENIED',
    status: 403
  }
}

/**
 * API response helper for authentication errors
 */
export function createAuthErrorResponse(message?: string) {
  return {
    error: message || 'Authentication required',
    code: 'AUTHENTICATION_REQUIRED',
    status: 401
  }
}

/**
 * Utility function to extract token from Next.js API request
 */
export function extractTokenFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fallback to cookie if no bearer token
  const tokenCookie = req.cookies['sb-access-token']
  return tokenCookie || null
}