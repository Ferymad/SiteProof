import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHash, randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

/**
 * Token Refresh Endpoint for JWT Token Rotation
 * Story 1.2 Task 6: Refresh token rotation for security
 * 
 * Implements secure refresh token rotation to prevent token reuse attacks
 */

interface RefreshTokenRequest {
  refreshToken: string
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { refreshToken }: RefreshTokenRequest = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      })
    }

    // Hash the refresh token to find it in database
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')

    // Find and validate the refresh token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('refresh_tokens')
      .select(`
        id,
        user_id,
        company_id,
        family_id,
        expires_at,
        is_active,
        ip_address,
        user_agent
      `)
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .single()

    if (tokenError || !tokenData) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      })
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // Token expired - invalidate the entire token family for security
      await invalidateTokenFamily(tokenData.family_id)
      
      return res.status(401).json({
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      })
    }

    // Get user data for new tokens
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, company_id')
      .eq('id', tokenData.user_id)
      .single()

    if (userError || !userData) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    // Verify user is still associated with the same company
    if (userData.company_id !== tokenData.company_id) {
      await invalidateTokenFamily(tokenData.family_id)
      
      return res.status(401).json({
        error: 'User company association changed',
        code: 'COMPANY_MISMATCH'
      })
    }

    // Check for potential token reuse (security violation)
    const clientIp = getClientIp(req)
    const userAgent = req.headers['user-agent'] || ''
    
    // If IP or user agent changed significantly, this might be suspicious
    const suspiciousActivity = await checkSuspiciousActivity(
      tokenData.ip_address,
      tokenData.user_agent,
      clientIp,
      userAgent
    )

    if (suspiciousActivity) {
      // Log security event and invalidate token family
      await logSecurityEvent({
        event: 'SUSPICIOUS_TOKEN_REFRESH',
        userId: tokenData.user_id,
        companyId: tokenData.company_id,
        details: {
          original_ip: tokenData.ip_address,
          current_ip: clientIp,
          original_user_agent: tokenData.user_agent,
          current_user_agent: userAgent
        }
      })

      await invalidateTokenFamily(tokenData.family_id)
      
      return res.status(401).json({
        error: 'Suspicious activity detected. Please log in again.',
        code: 'SUSPICIOUS_ACTIVITY'
      })
    }

    // Invalidate the current refresh token (rotation)
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ is_active: false })
      .eq('id', tokenData.id)

    // Generate new tokens
    const newTokens = await generateTokenPair(
      userData,
      tokenData.family_id,
      clientIp,
      userAgent
    )

    if (!newTokens) {
      return res.status(500).json({
        error: 'Failed to generate new tokens',
        code: 'TOKEN_GENERATION_FAILED'
      })
    }

    // Update last used timestamp
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('family_id', tokenData.family_id)
      .eq('is_active', true)

    const response: TokenResponse = {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: 15 * 60, // 15 minutes
      tokenType: 'Bearer'
    }

    // Set secure cookies (optional - for web app)
    const isProduction = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', [
      `sb-access-token=${newTokens.accessToken}; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=900`, // 15 minutes
      `sb-refresh-token=${newTokens.refreshToken}; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=604800` // 7 days
    ])

    return res.status(200).json(response)

  } catch (error: any) {
    console.error('Token refresh error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Generate new access and refresh token pair
 */
async function generateTokenPair(
  user: any,
  familyId: string,
  ipAddress: string | null,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    // Generate access token (JWT)
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      aud: 'authenticated',
      iss: 'bmad-auth',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT secret not configured')
    }

    const accessToken = jwt.sign(accessTokenPayload, jwtSecret)

    // Generate new refresh token
    const refreshToken = randomBytes(32).toString('hex')
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex')

    // Store new refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        company_id: user.company_id,
        token_hash: refreshTokenHash,
        family_id: familyId,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })

    if (error) {
      console.error('Error storing refresh token:', error)
      return null
    }

    return { accessToken, refreshToken }
  } catch (error) {
    console.error('Error generating token pair:', error)
    return null
  }
}

/**
 * Invalidate entire token family (for security breaches)
 */
async function invalidateTokenFamily(familyId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ is_active: false })
      .eq('family_id', familyId)
  } catch (error) {
    console.error('Error invalidating token family:', error)
  }
}

/**
 * Check for suspicious activity in token refresh
 */
async function checkSuspiciousActivity(
  originalIp: string | null,
  originalUserAgent: string | null,
  currentIp: string | null,
  currentUserAgent: string
): Promise<boolean> {
  // If we don't have original data, allow it (first time or missing data)
  if (!originalIp || !originalUserAgent) {
    return false
  }

  // Check for significant IP change (different networks)
  if (originalIp !== currentIp && currentIp) {
    // Allow same private network ranges
    const isPrivateOriginal = isPrivateIP(originalIp)
    const isPrivateCurrent = isPrivateIP(currentIp)
    
    if (isPrivateOriginal && isPrivateCurrent) {
      // Both private IPs - probably same network, allow
      return false
    }

    // Different public IPs might be suspicious
    if (!isPrivateOriginal && !isPrivateCurrent) {
      return true
    }
  }

  // Check for significant user agent change
  const userAgentSimilarity = calculateUserAgentSimilarity(originalUserAgent, currentUserAgent)
  if (userAgentSimilarity < 0.7) { // Less than 70% similar
    return true
  }

  return false
}

/**
 * Check if IP is in private range
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^127\./,
    /^::1$/,
    /^fc00:/,
    /^fd00:/
  ]
  
  return privateRanges.some(range => range.test(ip))
}

/**
 * Calculate similarity between user agents
 */
function calculateUserAgentSimilarity(ua1: string, ua2: string): number {
  if (ua1 === ua2) return 1.0
  
  // Extract key components (browser, version, OS)
  const extract = (ua: string) => {
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || ''
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || ''
    return `${browser} ${os}`.trim()
  }
  
  const key1 = extract(ua1)
  const key2 = extract(ua2)
  
  if (key1 === key2) return 1.0
  if (!key1 || !key2) return 0.0
  
  // Simple similarity based on common substring length
  let common = 0
  const shorter = key1.length < key2.length ? key1 : key2
  const longer = key1.length >= key2.length ? key1 : key2
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      common++
    }
  }
  
  return common / Math.max(key1.length, key2.length)
}

/**
 * Log security events
 */
async function logSecurityEvent(event: {
  event: string
  userId: string
  companyId: string
  details: any
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: event.companyId,
        user_id: event.userId,
        event_type: event.event,
        action: 'SECURITY_EVENT',
        new_data: event.details,
        risk_level: 'HIGH'
      })
  } catch (error) {
    console.error('Error logging security event:', error)
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