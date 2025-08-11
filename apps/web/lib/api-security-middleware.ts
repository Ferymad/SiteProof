import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { 
  getUserContext, 
  requirePermission, 
  UserContext,
  Permission,
  createAuthErrorResponse,
  createPermissionErrorResponse,
  extractTokenFromRequest
} from '@/lib/permissions'

export interface SecurityContext {
  userContext: UserContext
  requestId: string
  ipAddress: string
  userAgent: string
}

interface SecurityMiddlewareOptions {
  requiredPermission?: Permission
  auditEvent?: string
  skipAuditLog?: boolean
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
}

/**
 * Comprehensive API security middleware for multi-tenant security
 * Handles authentication, authorization, audit logging, and company context injection
 */
export function withSecurity(
  handler: (
    req: NextApiRequest, 
    res: NextApiResponse, 
    context: SecurityContext
  ) => Promise<void>,
  options: SecurityMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId()
    const ipAddress = getClientIpAddress(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Extract and validate authentication token
      const token = extractTokenFromRequest(req)
      if (!token) {
        const authError = createAuthErrorResponse('Authentication token required')
        await logSecurityEvent({
          event: 'AUTH_TOKEN_MISSING',
          ipAddress,
          userAgent,
          requestId,
          riskLevel: 'MEDIUM'
        })
        return res.status(authError.status).json(authError)
      }

      // Get user context with company information
      let userContext: UserContext
      try {
        if (options.requiredPermission) {
          userContext = await requirePermission(token, options.requiredPermission)
        } else {
          const context = await getUserContext(token)
          if (!context) {
            throw new Error('Invalid authentication token')
          }
          userContext = context
        }
      } catch (error: any) {
        await logSecurityEvent({
          event: 'AUTH_VALIDATION_FAILED',
          ipAddress,
          userAgent,
          requestId,
          error: error.message,
          riskLevel: 'HIGH'
        })

        if (error.message.includes('Insufficient permissions')) {
          const permError = createPermissionErrorResponse(error.message)
          return res.status(permError.status).json(permError)
        } else {
          const authError = createAuthErrorResponse('Authentication failed')
          return res.status(authError.status).json(authError)
        }
      }

      // Validate company context exists
      if (!userContext.company_id) {
        await logSecurityEvent({
          event: 'NO_COMPANY_CONTEXT',
          userId: userContext.id,
          ipAddress,
          userAgent,
          requestId,
          riskLevel: 'HIGH'
        })
        return res.status(403).json({
          error: 'User must be associated with a company',
          code: 'NO_COMPANY_CONTEXT'
        })
      }

      // Apply rate limiting if configured
      if (options.rateLimit) {
        const isAllowed = await checkRateLimit(
          userContext.company_id, 
          userContext.id, 
          options.rateLimit
        )
        if (!isAllowed) {
          await logSecurityEvent({
            event: 'RATE_LIMIT_EXCEEDED',
            userId: userContext.id,
            companyId: userContext.company_id,
            ipAddress,
            userAgent,
            requestId,
            riskLevel: 'MEDIUM'
          })
          return res.status(429).json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED'
          })
        }
      }

      // Create security context
      const securityContext: SecurityContext = {
        userContext,
        requestId,
        ipAddress,
        userAgent
      }

      // Log API access if audit event is specified
      if (options.auditEvent && !options.skipAuditLog) {
        await logAuditEvent({
          event: options.auditEvent,
          userId: userContext.id,
          companyId: userContext.company_id,
          ipAddress,
          userAgent,
          requestId,
          method: req.method || 'UNKNOWN',
          endpoint: req.url || 'UNKNOWN'
        })
      }

      // Call the actual handler with security context
      await handler(req, res, securityContext)

    } catch (error: any) {
      console.error(`API Error [${requestId}]:`, error)
      
      // Log unexpected errors as security events
      await logSecurityEvent({
        event: 'API_ERROR',
        requestId,
        ipAddress,
        userAgent,
        error: error.message,
        riskLevel: 'MEDIUM'
      })

      // Don't expose internal error details
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId
      })
    }
  }
}

/**
 * Utility to ensure database queries include company context
 * Prevents accidental cross-company data access
 */
export function withCompanyContext<T>(
  query: any, 
  companyId: string,
  tableName?: string
): T {
  // Add company_id filter to the query
  const contextQuery = query.eq('company_id', companyId)
  
  // Log the company-filtered query for audit
  console.log(`Company-filtered query on ${tableName}: company_id = ${companyId}`)
  
  return contextQuery
}

/**
 * Validate that a resource belongs to the user's company
 */
export async function validateCompanyResource(
  resourceId: string,
  tableName: string,
  expectedCompanyId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('company_id')
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      return false
    }

    return data.company_id === expectedCompanyId
  } catch (error) {
    console.error('Error validating company resource:', error)
    return false
  }
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get client IP address from request
 */
function getClientIpAddress(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string
  const realIp = req.headers['x-real-ip'] as string
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return req.connection?.remoteAddress || 'unknown'
}

/**
 * Simple in-memory rate limiting (production should use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(
  companyId: string, 
  userId: string, 
  options: { maxRequests: number; windowMs: number }
): Promise<boolean> {
  const key = `${companyId}:${userId}`
  const now = Date.now()
  const window = rateLimitStore.get(key)

  if (!window || now > window.resetTime) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs
    })
    return true
  }

  if (window.count >= options.maxRequests) {
    return false
  }

  // Increment count
  window.count++
  return true
}

/**
 * Log security events for breach detection
 */
interface SecurityEvent {
  event: string
  userId?: string
  companyId?: string
  ipAddress: string
  userAgent: string
  requestId: string
  error?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

async function logSecurityEvent(event: SecurityEvent) {
  try {
    // In production, this should also send to external security monitoring
    console.warn(`[SECURITY] ${event.event}:`, event)
    
    // Store in audit_logs table
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: event.companyId,
        user_id: event.userId,
        event_type: event.event,
        action: 'SECURITY_EVENT',
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        session_id: event.requestId,
        risk_level: event.riskLevel,
        risk_factors: event.error ? [event.error] : []
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Log audit events for compliance
 */
interface AuditEvent {
  event: string
  userId: string
  companyId: string
  ipAddress: string
  userAgent: string
  requestId: string
  method: string
  endpoint: string
  recordId?: string
  oldData?: any
  newData?: any
}

async function logAuditEvent(event: AuditEvent) {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: event.companyId,
        user_id: event.userId,
        event_type: event.event,
        action: event.method,
        record_id: event.recordId,
        old_data: event.oldData,
        new_data: event.newData,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        session_id: event.requestId,
        risk_level: 'LOW'
      })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Enhanced company context validator with automatic breach detection
 */
export async function validateAndLogCompanyAccess(
  userId: string,
  companyId: string,
  resourceCompanyId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const isValid = companyId === resourceCompanyId

  if (!isValid) {
    // This is a potential security breach - log it immediately
    await logSecurityEvent({
      event: 'CROSS_COMPANY_ACCESS_ATTEMPT',
      userId,
      companyId,
      ipAddress: 'api-server',
      userAgent: 'api-middleware',
      requestId: generateRequestId(),
      error: `User from company ${companyId} attempted to access ${resourceType} ${resourceId} from company ${resourceCompanyId}`,
      riskLevel: 'CRITICAL'
    })

    // Also create a security alert
    await supabaseAdmin
      .from('security_alerts')
      .insert({
        company_id: companyId,
        alert_type: 'CROSS_COMPANY_ACCESS',
        severity: 'CRITICAL',
        title: 'Unauthorized Cross-Company Data Access Attempt',
        description: `User attempted to access data belonging to another company. This may indicate a security breach or compromised account.`,
        trigger_data: {
          attempted_company_id: resourceCompanyId,
          resource_type: resourceType,
          resource_id: resourceId,
          timestamp: new Date().toISOString()
        },
        affected_users: [userId]
      })
  }

  return isValid
}