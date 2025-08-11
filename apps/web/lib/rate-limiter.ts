import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Advanced Rate Limiting System
 * Story 1.2 Task 6: Rate limiting per company and user
 * 
 * Supports multiple rate limiting strategies:
 * 1. Per-user rate limiting
 * 2. Per-company rate limiting  
 * 3. Per-API-key rate limiting
 * 4. Per-endpoint rate limiting
 * 5. Sliding window rate limiting
 */

interface RateLimitConfig {
  // Time windows
  perMinute?: number
  perHour?: number
  perDay?: number
  
  // Sliding window options
  windowSizeMs?: number
  maxRequests?: number
  
  // Burst protection
  burstLimit?: number
  burstWindowMs?: number
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

interface RateLimitKey {
  type: 'user' | 'company' | 'api_key' | 'endpoint' | 'ip'
  identifier: string
  endpoint?: string
  method?: string
}

/**
 * Advanced rate limiter with multiple strategies
 */
export class RateLimiter {
  private static instance: RateLimiter
  private store = new Map<string, RateLimitState>()
  
  // Cleanup old entries every 5 minutes
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * Check rate limit for a given key and configuration
   */
  async checkRateLimit(
    key: RateLimitKey,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const keyString = this.generateKeyString(key)
    const now = Date.now()

    // Get current state
    let state = this.store.get(keyString)
    if (!state) {
      state = {
        requests: [],
        lastReset: now,
        burstCount: 0,
        burstResetTime: now
      }
      this.store.set(keyString, state)
    }

    // Check sliding window rate limit
    if (config.windowSizeMs && config.maxRequests) {
      const result = this.checkSlidingWindow(state, now, config.windowSizeMs, config.maxRequests)
      if (!result.allowed) {
        await this.logRateLimitViolation(key, 'sliding_window', result)
        return result
      }
    }

    // Check burst protection
    if (config.burstLimit && config.burstWindowMs) {
      const result = this.checkBurstLimit(state, now, config.burstLimit, config.burstWindowMs)
      if (!result.allowed) {
        await this.logRateLimitViolation(key, 'burst', result)
        return result
      }
    }

    // Check fixed window limits (per minute, hour, day)
    if (config.perMinute || config.perHour || config.perDay) {
      const result = this.checkFixedWindows(state, now, config)
      if (!result.allowed) {
        await this.logRateLimitViolation(key, 'fixed_window', result)
        return result
      }
    }

    // Record successful request
    state.requests.push(now)
    if (config.burstLimit) {
      state.burstCount++
    }

    return {
      allowed: true,
      limit: config.maxRequests || config.perMinute || config.perHour || config.perDay || 100,
      remaining: this.calculateRemaining(state, config),
      resetTime: this.calculateResetTime(state, config)
    }
  }

  /**
   * Check multiple rate limits at once
   */
  async checkMultipleRateLimits(
    checks: Array<{ key: RateLimitKey; config: RateLimitConfig }>
  ): Promise<RateLimitResult[]> {
    const results: RateLimitResult[] = []
    
    for (const check of checks) {
      const result = await this.checkRateLimit(check.key, check.config)
      results.push(result)
      
      // If any check fails, don't process remaining requests
      if (!result.allowed) {
        break
      }
    }
    
    return results
  }

  /**
   * Get rate limit status without incrementing
   */
  async getRateLimitStatus(
    key: RateLimitKey,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const keyString = this.generateKeyString(key)
    const state = this.store.get(keyString)
    const now = Date.now()

    if (!state) {
      return {
        allowed: true,
        limit: config.maxRequests || config.perMinute || 100,
        remaining: config.maxRequests || config.perMinute || 100,
        resetTime: now + (config.windowSizeMs || 60000)
      }
    }

    // Calculate status without modifying state
    if (config.windowSizeMs && config.maxRequests) {
      const windowStart = now - config.windowSizeMs
      const requestsInWindow = state.requests.filter(time => time > windowStart).length
      
      return {
        allowed: requestsInWindow < config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - requestsInWindow),
        resetTime: Math.max(...state.requests.filter(time => time > windowStart)) + config.windowSizeMs
      }
    }

    return {
      allowed: true,
      limit: 100,
      remaining: 100,
      resetTime: now + 60000
    }
  }

  /**
   * Reset rate limit for a key (admin function)
   */
  async resetRateLimit(key: RateLimitKey): Promise<void> {
    const keyString = this.generateKeyString(key)
    this.store.delete(keyString)
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(key: RateLimitKey): Promise<{
    totalRequests: number
    requestsLastHour: number
    requestsLastMinute: number
    averageRequestsPerMinute: number
    lastRequestTime: number | null
  }> {
    const keyString = this.generateKeyString(key)
    const state = this.store.get(keyString)
    const now = Date.now()

    if (!state || state.requests.length === 0) {
      return {
        totalRequests: 0,
        requestsLastHour: 0,
        requestsLastMinute: 0,
        averageRequestsPerMinute: 0,
        lastRequestTime: null
      }
    }

    const oneHourAgo = now - (60 * 60 * 1000)
    const oneMinuteAgo = now - (60 * 1000)

    const requestsLastHour = state.requests.filter(time => time > oneHourAgo).length
    const requestsLastMinute = state.requests.filter(time => time > oneMinuteAgo).length

    // Calculate average over the time period we have data for
    const oldestRequest = Math.min(...state.requests)
    const timeSpanMinutes = (now - oldestRequest) / (60 * 1000)
    const averageRequestsPerMinute = timeSpanMinutes > 0 ? state.requests.length / timeSpanMinutes : 0

    return {
      totalRequests: state.requests.length,
      requestsLastHour,
      requestsLastMinute,
      averageRequestsPerMinute,
      lastRequestTime: Math.max(...state.requests)
    }
  }

  // Private methods

  private generateKeyString(key: RateLimitKey): string {
    const parts = [key.type, key.identifier]
    if (key.endpoint) parts.push(key.endpoint)
    if (key.method) parts.push(key.method)
    return parts.join(':')
  }

  private checkSlidingWindow(
    state: RateLimitState,
    now: number,
    windowSizeMs: number,
    maxRequests: number
  ): RateLimitResult {
    const windowStart = now - windowSizeMs
    
    // Remove old requests outside the window
    state.requests = state.requests.filter(time => time > windowStart)
    
    const requestsInWindow = state.requests.length
    const allowed = requestsInWindow < maxRequests
    
    return {
      allowed,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - requestsInWindow),
      resetTime: state.requests.length > 0 ? 
        Math.max(...state.requests) + windowSizeMs : 
        now + windowSizeMs,
      retryAfter: allowed ? undefined : Math.ceil(windowSizeMs / 1000)
    }
  }

  private checkBurstLimit(
    state: RateLimitState,
    now: number,
    burstLimit: number,
    burstWindowMs: number
  ): RateLimitResult {
    // Reset burst counter if window expired
    if (now - state.burstResetTime > burstWindowMs) {
      state.burstCount = 0
      state.burstResetTime = now
    }
    
    const allowed = state.burstCount < burstLimit
    
    return {
      allowed,
      limit: burstLimit,
      remaining: Math.max(0, burstLimit - state.burstCount),
      resetTime: state.burstResetTime + burstWindowMs,
      retryAfter: allowed ? undefined : Math.ceil((state.burstResetTime + burstWindowMs - now) / 1000)
    }
  }

  private checkFixedWindows(
    state: RateLimitState,
    now: number,
    config: RateLimitConfig
  ): RateLimitResult {
    const checks = []
    
    if (config.perMinute) {
      const minuteAgo = now - 60000
      const requestsThisMinute = state.requests.filter(time => time > minuteAgo).length
      if (requestsThisMinute >= config.perMinute) {
        return {
          allowed: false,
          limit: config.perMinute,
          remaining: 0,
          resetTime: Math.ceil(now / 60000) * 60000,
          retryAfter: Math.ceil((Math.ceil(now / 60000) * 60000 - now) / 1000)
        }
      }
    }
    
    if (config.perHour) {
      const hourAgo = now - 3600000
      const requestsThisHour = state.requests.filter(time => time > hourAgo).length
      if (requestsThisHour >= config.perHour) {
        return {
          allowed: false,
          limit: config.perHour,
          remaining: 0,
          resetTime: Math.ceil(now / 3600000) * 3600000,
          retryAfter: Math.ceil((Math.ceil(now / 3600000) * 3600000 - now) / 1000)
        }
      }
    }
    
    if (config.perDay) {
      const dayAgo = now - 86400000
      const requestsToday = state.requests.filter(time => time > dayAgo).length
      if (requestsToday >= config.perDay) {
        return {
          allowed: false,
          limit: config.perDay,
          remaining: 0,
          resetTime: Math.ceil(now / 86400000) * 86400000,
          retryAfter: Math.ceil((Math.ceil(now / 86400000) * 86400000 - now) / 1000)
        }
      }
    }
    
    return {
      allowed: true,
      limit: config.perDay || config.perHour || config.perMinute || 100,
      remaining: this.calculateRemaining(state, config),
      resetTime: this.calculateResetTime(state, config)
    }
  }

  private calculateRemaining(state: RateLimitState, config: RateLimitConfig): number {
    const now = Date.now()
    let remaining = Infinity

    if (config.perMinute) {
      const minuteAgo = now - 60000
      const requestsThisMinute = state.requests.filter(time => time > minuteAgo).length
      remaining = Math.min(remaining, config.perMinute - requestsThisMinute)
    }

    if (config.perHour) {
      const hourAgo = now - 3600000
      const requestsThisHour = state.requests.filter(time => time > hourAgo).length
      remaining = Math.min(remaining, config.perHour - requestsThisHour)
    }

    if (config.perDay) {
      const dayAgo = now - 86400000
      const requestsToday = state.requests.filter(time => time > dayAgo).length
      remaining = Math.min(remaining, config.perDay - requestsToday)
    }

    return Math.max(0, remaining === Infinity ? 100 : remaining)
  }

  private calculateResetTime(state: RateLimitState, config: RateLimitConfig): number {
    const now = Date.now()
    
    if (config.windowSizeMs) {
      return now + config.windowSizeMs
    }
    
    // Use the shortest fixed window
    if (config.perMinute) {
      return Math.ceil(now / 60000) * 60000
    }
    
    if (config.perHour) {
      return Math.ceil(now / 3600000) * 3600000
    }
    
    if (config.perDay) {
      return Math.ceil(now / 86400000) * 86400000
    }
    
    return now + 60000 // Default to 1 minute
  }

  private async logRateLimitViolation(
    key: RateLimitKey,
    violationType: string,
    result: RateLimitResult
  ): Promise<void> {
    try {
      // Attempt to log to audit_logs if we can determine company_id
      if (key.type === 'company') {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            company_id: key.identifier,
            event_type: 'RATE_LIMIT_VIOLATION',
            action: 'BLOCKED',
            new_data: {
              violation_type: violationType,
              key_type: key.type,
              key_identifier: key.identifier,
              endpoint: key.endpoint,
              method: key.method,
              limit: result.limit,
              retry_after: result.retryAfter
            },
            risk_level: 'MEDIUM'
          })
      }
    } catch (error) {
      console.error('Failed to log rate limit violation:', error)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [key, state] of Array.from(this.store.entries())) {
      // Remove requests older than max age
      state.requests = state.requests.filter(time => now - time < maxAge)
      
      // Remove empty states
      if (state.requests.length === 0 && now - state.lastReset > maxAge) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

interface RateLimitState {
  requests: number[]
  lastReset: number
  burstCount: number
  burstResetTime: number
}

// Default rate limit configurations
export const DEFAULT_RATE_LIMITS = {
  USER_API: {
    perMinute: 100,
    perHour: 1000,
    perDay: 10000,
    burstLimit: 10,
    burstWindowMs: 1000
  },
  
  API_KEY: {
    perMinute: 300,
    perHour: 5000,
    perDay: 50000,
    burstLimit: 20,
    burstWindowMs: 1000
  },
  
  COMPANY_AGGREGATE: {
    perMinute: 500,
    perHour: 10000,
    perDay: 100000
  },
  
  ANONYMOUS: {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
    burstLimit: 3,
    burstWindowMs: 1000
  },
  
  ADMIN_API: {
    perMinute: 200,
    perHour: 2000,
    perDay: 20000
  }
} as const

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance()

// Export types
export type { RateLimitConfig, RateLimitResult, RateLimitKey }