import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest, generateApiKey } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHash } from 'crypto'

/**
 * API Keys Management Endpoint
 * Story 1.2 Task 6: API authentication for integrations
 * 
 * Allows company admins to create, view, and manage API keys
 */

interface CreateApiKeyRequest {
  name: string
  description?: string
  permissions?: string[]
  scopes?: ('read' | 'write' | 'admin')[]
  rateLimits?: {
    requestsPerMinute?: number
    requestsPerHour?: number
    requestsPerDay?: number
  }
  expiresIn?: number // Days from now
}

interface ApiKeyResponse {
  id: string
  name: string
  description?: string
  key?: string // Only returned on creation
  keyPrefix: string
  permissions: string[]
  scopes: string[]
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  isActive: boolean
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req

  // Only company admins can manage API keys
  if (user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Only company administrators can manage API keys',
      code: 'ADMIN_REQUIRED'
    })
  }

  try {
    if (req.method === 'GET') {
      // List company's API keys
      const { data: apiKeys, error } = await supabaseAdmin
        .from('api_keys')
        .select(`
          id,
          name,
          description,
          key_prefix,
          permissions,
          scopes,
          rate_limit_requests_per_minute,
          rate_limit_requests_per_hour,
          rate_limit_requests_per_day,
          is_active,
          expires_at,
          last_used_at,
          created_at
        `)
        .eq('company_id', user!.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching API keys:', error)
        return res.status(500).json({ error: 'Failed to fetch API keys' })
      }

      const formattedKeys: ApiKeyResponse[] = (apiKeys || []).map(key => ({
        id: key.id,
        name: key.name,
        description: key.description,
        keyPrefix: key.key_prefix,
        permissions: key.permissions || [],
        scopes: key.scopes || ['read'],
        rateLimits: {
          requestsPerMinute: key.rate_limit_requests_per_minute || 60,
          requestsPerHour: key.rate_limit_requests_per_hour || 1000,
          requestsPerDay: key.rate_limit_requests_per_day || 10000
        },
        isActive: key.is_active,
        expiresAt: key.expires_at,
        lastUsedAt: key.last_used_at,
        createdAt: key.created_at
      }))

      return res.status(200).json({ apiKeys: formattedKeys })
    }

    if (req.method === 'POST') {
      // Create new API key
      const {
        name,
        description,
        permissions = [],
        scopes = ['read'],
        rateLimits = {},
        expiresIn
      }: CreateApiKeyRequest = req.body

      // Validate input
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'API key name is required',
          code: 'NAME_REQUIRED'
        })
      }

      if (name.length > 255) {
        return res.status(400).json({
          error: 'API key name must be 255 characters or less',
          code: 'NAME_TOO_LONG'
        })
      }

      // Validate scopes
      const validScopes = ['read', 'write', 'admin']
      const invalidScopes = scopes.filter(scope => !validScopes.includes(scope))
      if (invalidScopes.length > 0) {
        return res.status(400).json({
          error: `Invalid scopes: ${invalidScopes.join(', ')}`,
          code: 'INVALID_SCOPES'
        })
      }

      // Check if name already exists for this company
      const { data: existingKey } = await supabaseAdmin
        .from('api_keys')
        .select('id')
        .eq('company_id', user!.company_id)
        .eq('name', name.trim())
        .single()

      if (existingKey) {
        return res.status(409).json({
          error: 'API key with this name already exists',
          code: 'NAME_ALREADY_EXISTS'
        })
      }

      // Generate the API key
      const apiKey = generateApiKey()
      const keyHash = createHash('sha256').update(apiKey).digest('hex')
      const keyPrefix = apiKey.substring(0, 12) // First 12 characters for display

      // Calculate expiration date
      let expiresAt = null
      if (expiresIn && expiresIn > 0) {
        const expireDate = new Date()
        expireDate.setDate(expireDate.getDate() + expiresIn)
        expiresAt = expireDate.toISOString()
      }

      // Create API key record
      const { data: newApiKey, error } = await supabaseAdmin
        .from('api_keys')
        .insert({
          company_id: user!.company_id,
          name: name.trim(),
          description: description?.trim() || null,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: permissions,
          scopes: scopes,
          rate_limit_requests_per_minute: rateLimits.requestsPerMinute || 60,
          rate_limit_requests_per_hour: rateLimits.requestsPerHour || 1000,
          rate_limit_requests_per_day: rateLimits.requestsPerDay || 10000,
          expires_at: expiresAt,
          created_by: user!.id,
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'] || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating API key:', error)
        return res.status(500).json({ error: 'Failed to create API key' })
      }

      // Return the new API key (including the actual key - only shown once)
      const response: ApiKeyResponse = {
        id: newApiKey.id,
        name: newApiKey.name,
        description: newApiKey.description,
        key: apiKey, // Only returned on creation!
        keyPrefix: newApiKey.key_prefix,
        permissions: newApiKey.permissions || [],
        scopes: newApiKey.scopes || ['read'],
        rateLimits: {
          requestsPerMinute: newApiKey.rate_limit_requests_per_minute,
          requestsPerHour: newApiKey.rate_limit_requests_per_hour,
          requestsPerDay: newApiKey.rate_limit_requests_per_day
        },
        isActive: newApiKey.is_active,
        expiresAt: newApiKey.expires_at,
        createdAt: newApiKey.created_at
      }

      return res.status(201).json({ apiKey: response })
    }

    if (req.method === 'PATCH') {
      // Update API key (activate/deactivate, update permissions, etc.)
      const { id, isActive, permissions, scopes, rateLimits } = req.body

      if (!id) {
        return res.status(400).json({
          error: 'API key ID is required',
          code: 'ID_REQUIRED'
        })
      }

      // Verify the API key belongs to this company
      const { data: existingKey, error: fetchError } = await supabaseAdmin
        .from('api_keys')
        .select('id, company_id, name')
        .eq('id', id)
        .eq('company_id', user!.company_id)
        .single()

      if (fetchError || !existingKey) {
        return res.status(404).json({
          error: 'API key not found',
          code: 'API_KEY_NOT_FOUND'
        })
      }

      // Build update object
      const updateData: Partial<{
        is_active: boolean
        name: string
        description: string
        permissions: string[]
        scopes: string[]
        rate_limits: Record<string, number>
        rate_limit_requests_per_minute: number
        rate_limit_requests_per_hour: number
        rate_limit_requests_per_day: number
      }> = {}
      
      if (typeof isActive === 'boolean') {
        updateData.is_active = isActive
      }
      
      if (permissions && Array.isArray(permissions)) {
        updateData.permissions = permissions
      }
      
      if (scopes && Array.isArray(scopes)) {
        const validScopes = ['read', 'write', 'admin']
        const invalidScopes = scopes.filter(scope => !validScopes.includes(scope))
        if (invalidScopes.length > 0) {
          return res.status(400).json({
            error: `Invalid scopes: ${invalidScopes.join(', ')}`,
            code: 'INVALID_SCOPES'
          })
        }
        updateData.scopes = scopes
      }
      
      if (rateLimits) {
        if (rateLimits.requestsPerMinute) {
          updateData.rate_limit_requests_per_minute = rateLimits.requestsPerMinute
        }
        if (rateLimits.requestsPerHour) {
          updateData.rate_limit_requests_per_hour = rateLimits.requestsPerHour
        }
        if (rateLimits.requestsPerDay) {
          updateData.rate_limit_requests_per_day = rateLimits.requestsPerDay
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid update fields provided',
          code: 'NO_UPDATE_FIELDS'
        })
      }

      // Update the API key
      const { error: updateError } = await supabaseAdmin
        .from('api_keys')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', user!.company_id)

      if (updateError) {
        console.error('Error updating API key:', updateError)
        return res.status(500).json({ error: 'Failed to update API key' })
      }

      return res.status(200).json({ 
        message: 'API key updated successfully',
        id: id 
      })
    }

    if (req.method === 'DELETE') {
      // Delete API key
      const { id } = req.body

      if (!id) {
        return res.status(400).json({
          error: 'API key ID is required',
          code: 'ID_REQUIRED'
        })
      }

      // Verify the API key belongs to this company and delete it
      const { error } = await supabaseAdmin
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('company_id', user!.company_id)

      if (error) {
        console.error('Error deleting API key:', error)
        return res.status(500).json({ error: 'Failed to delete API key' })
      }

      return res.status(200).json({ 
        message: 'API key deleted successfully',
        id: id 
      })
    }

    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })

  } catch (error: unknown) {
    console.error('API keys endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Get client IP address
 */
function getClientIp(req: NextApiRequest): string | null {
  const forwarded = req.headers['x-forwarded-for'] as string
  const realIp = req.headers['x-real-ip'] as string
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return null
}

// Apply authentication middleware
export default withAuth(handler, {
  requiredPermission: 'API_COMPANY_WRITE',
  requireCompany: true,
  rateLimits: {
    jwt: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    apiKey: { requests: 50, windowMs: 60 * 1000 } // 50 requests per minute
  }
})