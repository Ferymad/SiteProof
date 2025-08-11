import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { UserContext, Permission, hasPermission } from '@/lib/permissions'

/**
 * JWT Token Validation Middleware for API Authentication
 * Story 1.2 Task 6: Configure API authentication
 * 
 * Supports multiple authentication methods:
 * 1. Supabase JWT tokens (for web app)
 * 2. API keys (for integrations)
 * 3. Refresh token rotation
 */

interface AuthenticatedRequest extends NextApiRequest {
  user?: UserContext
  authMethod?: 'jwt' | 'api_key'
  apiKey?: ApiKeyInfo
}

interface ApiKeyInfo {
  id: string
  company_id: string
  name: string
  permissions: string[]
  rate_limit: {
    requests_per_minute: number
    requests_per_hour: number
  }
  last_used: Date
}

interface AuthMiddlewareOptions {
  requiredPermission?: Permission
  allowApiKeys?: boolean
  requireCompany?: boolean
  rateLimits?: {
    jwt: { requests: number; windowMs: number }
    apiKey: { requests: number; windowMs: number }
  }
}

/**
 * Main authentication middleware factory
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Apply CORS headers first
      applyCorsHeaders(req, res)

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }

      // Extract and validate authentication
      const authResult = await authenticateRequest(req, options)
      
      if (!authResult.success) {
        return res.status(401).json({
          error: authResult.error,
          code: 'AUTHENTICATION_FAILED'
        })
      }

      req.user = authResult.user
      req.authMethod = authResult.method
      req.apiKey = authResult.apiKey

      // Check required permissions
      if (options.requiredPermission) {
        const hasRequiredPermission = hasPermission(req.user!.role, options.requiredPermission)
        if (!hasRequiredPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: options.requiredPermission
          })
        }
      }

      // Check company requirement
      if (options.requireCompany && !req.user!.company_id) {
        return res.status(403).json({
          error: 'User must be associated with a company',
          code: 'COMPANY_REQUIRED'
        })
      }

      // Apply rate limiting
      if (options.rateLimits) {
        const rateLimitResult = await checkRateLimit(req, options.rateLimits)
        if (!rateLimitResult.allowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          })
        }
      }

      // Update API key last used timestamp
      if (req.authMethod === 'api_key' && req.apiKey) {
        await updateApiKeyUsage(req.apiKey.id)
      }

      // Call the actual handler
      await handler(req, res)

    } catch (error: any) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })
    }
  }
}

/**
 * Authenticate request using multiple methods
 */
async function authenticateRequest(
  req: AuthenticatedRequest,
  options: AuthMiddlewareOptions
): Promise<{
  success: boolean
  error?: string
  user?: UserContext
  method?: 'jwt' | 'api_key'
  apiKey?: ApiKeyInfo
}> {
  // Try JWT token first (Authorization header)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    // Check if it's an API key
    if (token.startsWith('bmad_')) {
      if (!options.allowApiKeys) {
        return { success: false, error: 'API keys not allowed for this endpoint' }
      }
      
      const apiKeyResult = await validateApiKey(token)
      if (apiKeyResult.success) {
        return {
          success: true,
          user: apiKeyResult.user,
          method: 'api_key',
          apiKey: apiKeyResult.apiKey
        }
      }
    } else {
      // Validate as JWT token
      const jwtResult = await validateJwtToken(token)
      if (jwtResult.success) {
        return {
          success: true,
          user: jwtResult.user,
          method: 'jwt'
        }
      }
    }
  }

  // Try cookie-based authentication (for web app)
  const cookieToken = req.cookies['sb-access-token']
  if (cookieToken) {
    const jwtResult = await validateJwtToken(cookieToken)
    if (jwtResult.success) {
      return {
        success: true,
        user: jwtResult.user,
        method: 'jwt'
      }
    }
  }

  return { success: false, error: 'No valid authentication found' }
}

/**
 * Validate JWT token from Supabase
 */
async function validateJwtToken(token: string): Promise<{
  success: boolean
  user?: UserContext
  error?: string
}> {
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { success: false, error: 'Invalid JWT token' }
    }

    // Get user profile with company and role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role, company_id, email, name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    return {
      success: true,
      user: {
        id: profile.id,
        role: profile.role,
        company_id: profile.company_id,
        email: profile.email,
        name: profile.name
      }
    }
  } catch (error) {
    console.error('JWT validation error:', error)
    return { success: false, error: 'JWT validation failed' }
  }
}

/**
 * Validate API key for integrations
 */
async function validateApiKey(apiKey: string): Promise<{
  success: boolean
  user?: UserContext
  apiKey?: ApiKeyInfo
  error?: string
}> {
  try {
    // Get API key from database
    const { data: keyData, error } = await supabaseAdmin
      .from('api_keys')
      .select(`
        id,
        company_id,
        name,
        permissions,
        rate_limit_requests_per_minute,
        rate_limit_requests_per_hour,
        last_used_at,
        expires_at,
        is_active,
        companies!inner(name, type)
      `)
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single()

    if (error || !keyData) {
      return { success: false, error: 'Invalid API key' }
    }

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { success: false, error: 'API key expired' }
    }

    // Create user context from API key
    const userContext: UserContext = {
      id: keyData.id, // Using API key ID as user ID for audit
      role: 'admin', // API keys have admin privileges within their company
      company_id: keyData.company_id,
      email: `api-key-${keyData.name}@${keyData.companies[0]?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}.internal`,
      name: `API Key: ${keyData.name}`
    }

    const apiKeyInfo: ApiKeyInfo = {
      id: keyData.id,
      company_id: keyData.company_id,
      name: keyData.name,
      permissions: keyData.permissions || [],
      rate_limit: {
        requests_per_minute: keyData.rate_limit_requests_per_minute || 60,
        requests_per_hour: keyData.rate_limit_requests_per_hour || 1000
      },
      last_used: keyData.last_used_at ? new Date(keyData.last_used_at) : new Date()
    }

    return {
      success: true,
      user: userContext,
      apiKey: apiKeyInfo
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { success: false, error: 'API key validation failed' }
  }
}

/**
 * Apply CORS headers for API authentication
 */
function applyCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
    ...(process.env.ALLOWED_CORS_ORIGINS?.split(',') || [])
  ]

  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-API-Key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
}

/**
 * Rate limiting implementation
 */
const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
}>()

async function checkRateLimit(
  req: AuthenticatedRequest,
  limits: AuthMiddlewareOptions['rateLimits']
): Promise<{
  allowed: boolean
  limit?: number
  remaining?: number
  resetTime?: number
}> {
  if (!limits) return { allowed: true }

  const authMethod = req.authMethod!
  // Map auth method names to limit keys
  const limitKey = authMethod === 'api_key' ? 'apiKey' : authMethod
  const limit = limits[limitKey as keyof typeof limits]
  if (!limit) return { allowed: true }

  // Create unique key based on user/company and auth method
  const userId = req.user!.id
  const companyId = req.user!.company_id
  const key = `${authMethod}:${companyId}:${userId}`

  const now = Date.now()
  const window = rateLimitStore.get(key)

  if (!window || now > window.resetTime) {
    // Reset window
    const newWindow = {
      count: 1,
      resetTime: now + limit.windowMs
    }
    rateLimitStore.set(key, newWindow)
    
    return {
      allowed: true,
      limit: limit.requests,
      remaining: limit.requests - 1,
      resetTime: newWindow.resetTime
    }
  }

  if (window.count >= limit.requests) {
    return {
      allowed: false,
      limit: limit.requests,
      remaining: 0,
      resetTime: window.resetTime
    }
  }

  // Increment count
  window.count++
  
  return {
    allowed: true,
    limit: limit.requests,
    remaining: limit.requests - window.count,
    resetTime: window.resetTime
  }
}

/**
 * Update API key last used timestamp
 */
async function updateApiKeyUsage(apiKeyId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId)
  } catch (error) {
    console.error('Failed to update API key usage:', error)
  }
}

/**
 * Hash API key for storage (one-way)
 */
function hashApiKey(apiKey: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  const crypto = require('crypto')
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return `bmad_${randomBytes}`
}

// Export types for use in other files
export type { AuthenticatedRequest, ApiKeyInfo, AuthMiddlewareOptions }