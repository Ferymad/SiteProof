import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * CORS Origins Management Endpoint
 * Story 1.2 Task 6: Configure CORS policies for authorized domains
 * 
 * Allows company admins to manage allowed CORS origins for API access
 */

interface CorsOrigin {
  id?: string
  origin: string
  description?: string
  isActive: boolean
  allowCredentials: boolean
  allowedMethods: string[]
  allowedHeaders: string[]
  maxAge: number
  createdAt?: string
  updatedAt?: string
}

interface CreateCorsOriginRequest {
  origin: string
  description?: string
  allowCredentials?: boolean
  allowedMethods?: string[]
  allowedHeaders?: string[]
  maxAge?: number
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req

  // Only company admins can manage CORS origins
  if (user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Only company administrators can manage CORS origins',
      code: 'ADMIN_REQUIRED'
    })
  }

  try {
    if (req.method === 'GET') {
      // List company's CORS origins
      const { data: corsOrigins, error } = await supabaseAdmin
        .from('cors_origins')
        .select('*')
        .eq('company_id', user!.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching CORS origins:', error)
        return res.status(500).json({ error: 'Failed to fetch CORS origins' })
      }

      const formattedOrigins: CorsOrigin[] = (corsOrigins || []).map(origin => ({
        id: origin.id,
        origin: origin.origin,
        description: origin.description,
        isActive: origin.is_active,
        allowCredentials: origin.allow_credentials,
        allowedMethods: origin.allowed_methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: origin.allowed_headers || ['Authorization', 'Content-Type'],
        maxAge: origin.max_age || 86400,
        createdAt: origin.created_at,
        updatedAt: origin.updated_at
      }))

      return res.status(200).json({ corsOrigins: formattedOrigins })
    }

    if (req.method === 'POST') {
      // Create new CORS origin
      const {
        origin,
        description,
        allowCredentials = false,
        allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders = ['Authorization', 'Content-Type'],
        maxAge = 86400
      }: CreateCorsOriginRequest = req.body

      // Validate input
      if (!origin || !isValidOrigin(origin)) {
        return res.status(400).json({
          error: 'Valid origin is required (e.g., https://app.example.com)',
          code: 'INVALID_ORIGIN'
        })
      }

      // Validate methods
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
      const invalidMethods = allowedMethods.filter(method => !validMethods.includes(method))
      if (invalidMethods.length > 0) {
        return res.status(400).json({
          error: `Invalid HTTP methods: ${invalidMethods.join(', ')}`,
          code: 'INVALID_METHODS'
        })
      }

      // Validate headers
      const validHeaders = [
        'Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With',
        'X-API-Key', 'Cache-Control', 'Pragma', 'If-Modified-Since'
      ]
      const invalidHeaders = allowedHeaders.filter(header => 
        !validHeaders.includes(header) && !header.startsWith('X-')
      )
      if (invalidHeaders.length > 0) {
        return res.status(400).json({
          error: `Invalid headers: ${invalidHeaders.join(', ')}. Custom headers must start with X-`,
          code: 'INVALID_HEADERS'
        })
      }

      // Check if origin already exists for this company
      const { data: existingOrigin } = await supabaseAdmin
        .from('cors_origins')
        .select('id')
        .eq('company_id', user!.company_id)
        .eq('origin', origin.toLowerCase())
        .single()

      if (existingOrigin) {
        return res.status(409).json({
          error: 'CORS origin already exists for this company',
          code: 'ORIGIN_ALREADY_EXISTS'
        })
      }

      // Security checks
      const securityWarnings = validateOriginSecurity(origin)
      
      // Create CORS origin record
      const { data: newOrigin, error } = await supabaseAdmin
        .from('cors_origins')
        .insert({
          company_id: user!.company_id,
          origin: origin.toLowerCase(),
          description: description?.trim() || null,
          is_active: true,
          allow_credentials: allowCredentials,
          allowed_methods: allowedMethods,
          allowed_headers: allowedHeaders,
          max_age: Math.min(Math.max(maxAge, 300), 86400), // Between 5 minutes and 24 hours
          created_by: user!.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating CORS origin:', error)
        return res.status(500).json({ error: 'Failed to create CORS origin' })
      }

      const response: CorsOrigin = {
        id: newOrigin.id,
        origin: newOrigin.origin,
        description: newOrigin.description,
        isActive: newOrigin.is_active,
        allowCredentials: newOrigin.allow_credentials,
        allowedMethods: newOrigin.allowed_methods,
        allowedHeaders: newOrigin.allowed_headers,
        maxAge: newOrigin.max_age,
        createdAt: newOrigin.created_at,
        updatedAt: newOrigin.updated_at
      }

      return res.status(201).json({ 
        corsOrigin: response,
        securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
      })
    }

    if (req.method === 'PATCH') {
      // Update CORS origin
      const { id, isActive, allowCredentials, allowedMethods, allowedHeaders, maxAge, description } = req.body

      if (!id) {
        return res.status(400).json({
          error: 'CORS origin ID is required',
          code: 'ID_REQUIRED'
        })
      }

      // Verify the CORS origin belongs to this company
      const { data: existingOrigin, error: fetchError } = await supabaseAdmin
        .from('cors_origins')
        .select('id, company_id, origin')
        .eq('id', id)
        .eq('company_id', user!.company_id)
        .single()

      if (fetchError || !existingOrigin) {
        return res.status(404).json({
          error: 'CORS origin not found',
          code: 'ORIGIN_NOT_FOUND'
        })
      }

      // Build update object
      const updateData: any = {}
      
      if (typeof isActive === 'boolean') {
        updateData.is_active = isActive
      }
      
      if (typeof allowCredentials === 'boolean') {
        updateData.allow_credentials = allowCredentials
      }
      
      if (allowedMethods && Array.isArray(allowedMethods)) {
        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
        const invalidMethods = allowedMethods.filter(method => !validMethods.includes(method))
        if (invalidMethods.length > 0) {
          return res.status(400).json({
            error: `Invalid HTTP methods: ${invalidMethods.join(', ')}`,
            code: 'INVALID_METHODS'
          })
        }
        updateData.allowed_methods = allowedMethods
      }
      
      if (allowedHeaders && Array.isArray(allowedHeaders)) {
        updateData.allowed_headers = allowedHeaders
      }
      
      if (typeof maxAge === 'number') {
        updateData.max_age = Math.min(Math.max(maxAge, 300), 86400) // Between 5 minutes and 24 hours
      }
      
      if (typeof description === 'string') {
        updateData.description = description.trim() || null
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid update fields provided',
          code: 'NO_UPDATE_FIELDS'
        })
      }

      // Update the CORS origin
      const { error: updateError } = await supabaseAdmin
        .from('cors_origins')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', user!.company_id)

      if (updateError) {
        console.error('Error updating CORS origin:', updateError)
        return res.status(500).json({ error: 'Failed to update CORS origin' })
      }

      return res.status(200).json({ 
        message: 'CORS origin updated successfully',
        id: id 
      })
    }

    if (req.method === 'DELETE') {
      // Delete CORS origin
      const { id } = req.body

      if (!id) {
        return res.status(400).json({
          error: 'CORS origin ID is required',
          code: 'ID_REQUIRED'
        })
      }

      // Verify the CORS origin belongs to this company and delete it
      const { error } = await supabaseAdmin
        .from('cors_origins')
        .delete()
        .eq('id', id)
        .eq('company_id', user!.company_id)

      if (error) {
        console.error('Error deleting CORS origin:', error)
        return res.status(500).json({ error: 'Failed to delete CORS origin' })
      }

      return res.status(200).json({ 
        message: 'CORS origin deleted successfully',
        id: id 
      })
    }

    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })

  } catch (error: any) {
    console.error('CORS origins endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Validate origin format
 */
function isValidOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    
    // Must be https in production (allow http for localhost in development)
    if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
      // Allow localhost for development/testing
      if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        return false
      }
    }
    
    // Must have valid protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }
    
    // Must have hostname
    if (!url.hostname) {
      return false
    }
    
    // No path allowed (origin only)
    if (url.pathname !== '/') {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Validate origin security and return warnings
 */
function validateOriginSecurity(origin: string): string[] {
  const warnings: string[] = []
  
  try {
    const url = new URL(origin)
    
    // Warn about HTTP in production
    if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
      warnings.push('HTTP origins are not secure in production. Consider using HTTPS.')
    }
    
    // Warn about wildcards (not actually supported here, but check for common mistakes)
    if (origin.includes('*')) {
      warnings.push('Wildcard origins are not supported. Specify exact origins for security.')
    }
    
    // Warn about suspicious domains
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'localhost', '127.0.0.1']
    if (suspiciousDomains.some(domain => url.hostname.includes(domain)) && process.env.NODE_ENV === 'production') {
      warnings.push('This domain may pose security risks in production environments.')
    }
    
    // Warn about non-standard ports in production
    if (process.env.NODE_ENV === 'production' && url.port && !['80', '443'].includes(url.port)) {
      warnings.push('Non-standard ports may cause connectivity issues for some users.')
    }
    
  } catch {
    warnings.push('Unable to validate origin security.')
  }
  
  return warnings
}

// Apply authentication middleware
export default withAuth(handler, {
  requiredPermission: 'API_COMPANY_WRITE',
  requireCompany: true,
  rateLimits: {
    jwt: { requests: 50, windowMs: 60 * 1000 }, // 50 requests per minute
    apiKey: { requests: 25, windowMs: 60 * 1000 } // 25 requests per minute
  }
})