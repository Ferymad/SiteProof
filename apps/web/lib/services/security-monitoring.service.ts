import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Security Monitoring Service
 * Implements automated security breach detection and alerting
 * Story 1.2 Task 5: Multi-tenant security implementation
 */

export interface SecurityAlert {
  id?: string
  company_id: string
  alert_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  trigger_data: any
  affected_users: string[]
  status?: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
}

export interface SecurityMetrics {
  company_id: string
  period_hours: number
  total_requests: number
  failed_auth_attempts: number
  cross_company_attempts: number
  bulk_access_attempts: number
  unusual_ip_addresses: number
  risk_score: number
}

export class SecurityMonitoringService {
  
  /**
   * Run comprehensive security analysis and generate alerts
   */
  async runSecurityAnalysis(lookbackHours: number = 1): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []
    
    try {
      // 1. Detect cross-company access attempts
      const crossCompanyAlerts = await this.detectCrossCompanyAccess(lookbackHours)
      alerts.push(...crossCompanyAlerts)

      // 2. Detect bulk data access patterns
      const bulkAccessAlerts = await this.detectBulkDataAccess(lookbackHours)
      alerts.push(...bulkAccessAlerts)

      // 3. Detect unusual authentication patterns
      const authAlerts = await this.detectAuthAnomalies(lookbackHours)
      alerts.push(...authAlerts)

      // 4. Detect suspicious IP patterns
      const ipAlerts = await this.detectSuspiciousIPs(lookbackHours)
      alerts.push(...ipAlerts)

      // 5. Detect privilege escalation attempts
      const privilegeAlerts = await this.detectPrivilegeEscalation(lookbackHours)
      alerts.push(...privilegeAlerts)

      // Store new alerts in database
      if (alerts.length > 0) {
        await this.storeSecurityAlerts(alerts)
      }

      console.log(`Security analysis complete: ${alerts.length} new alerts generated`)
      return alerts

    } catch (error) {
      console.error('Error in security analysis:', error)
      throw error
    }
  }

  /**
   * Detect users attempting to access data from other companies
   */
  private async detectCrossCompanyAccess(lookbackHours: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    try {
      // Look for audit logs where a user's company doesn't match the accessed resource's company
      const { data: violations, error } = await supabaseAdmin
        .rpc('detect_cross_company_violations', {
          lookback_hours: lookbackHours
        })

      if (error) {
        console.error('Error detecting cross-company access:', error)
        return alerts
      }

      for (const violation of violations || []) {
        alerts.push({
          company_id: violation.user_company_id,
          alert_type: 'CROSS_COMPANY_ACCESS',
          severity: 'CRITICAL',
          title: 'Unauthorized Cross-Company Data Access Detected',
          description: `User ${violation.user_email} from ${violation.user_company_name} attempted to access data belonging to ${violation.target_company_name}. This indicates a potential security breach or compromised account.`,
          trigger_data: {
            user_id: violation.user_id,
            user_email: violation.user_email,
            user_company_id: violation.user_company_id,
            target_company_id: violation.target_company_id,
            access_count: violation.access_count,
            first_violation: violation.first_violation,
            last_violation: violation.last_violation
          },
          affected_users: [violation.user_id]
        })
      }

    } catch (error) {
      console.error('Error in detectCrossCompanyAccess:', error)
    }

    return alerts
  }

  /**
   * Detect bulk data access that might indicate data exfiltration
   */
  private async detectBulkDataAccess(lookbackHours: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

      const { data: bulkAccess, error } = await supabaseAdmin
        .from('audit_logs')
        .select(`
          user_id,
          company_id,
          event_type,
          created_at,
          users!inner(name, email, company_id)
        `)
        .gte('created_at', cutoffTime)
        .in('event_type', ['whatsapp_submissions', 'processing_analytics', 'users'])
        .eq('action', 'SELECT')

      if (error) {
        console.error('Error detecting bulk access:', error)
        return alerts
      }

      // Group by user and count accesses
      const userAccessCounts = new Map<string, {
        count: number
        user: any
        company_id: string
      }>()

      for (const access of bulkAccess || []) {
        const key = access.user_id
        if (!userAccessCounts.has(key)) {
          userAccessCounts.set(key, {
            count: 0,
            user: access.users,
            company_id: access.company_id
          })
        }
        userAccessCounts.get(key)!.count++
      }

      // Flag users with >100 accesses in the time period
      for (const [userId, data] of Array.from(userAccessCounts.entries())) {
        if (data.count > 100) {
          alerts.push({
            company_id: data.company_id,
            alert_type: 'BULK_DATA_ACCESS',
            severity: data.count > 500 ? 'CRITICAL' : 'HIGH',
            title: 'Unusual High-Volume Data Access Detected',
            description: `User ${data.user.email} performed ${data.count} data access operations in ${lookbackHours} hours, which is significantly above normal patterns. This may indicate data exfiltration attempts.`,
            trigger_data: {
              user_id: userId,
              access_count: data.count,
              time_period_hours: lookbackHours,
              threshold_exceeded: data.count > 100
            },
            affected_users: [userId]
          })
        }
      }

    } catch (error) {
      console.error('Error in detectBulkDataAccess:', error)
    }

    return alerts
  }

  /**
   * Detect authentication anomalies
   */
  private async detectAuthAnomalies(lookbackHours: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

      // Look for multiple failed authentication attempts
      const { data: authFailures, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('created_at', cutoffTime)
        .in('event_type', ['AUTH_VALIDATION_FAILED', 'AUTH_TOKEN_MISSING'])

      if (error) {
        console.error('Error detecting auth anomalies:', error)
        return alerts
      }

      // Group by IP address to detect brute force attempts
      const ipFailureCounts = new Map<string, {
        count: number
        company_ids: Set<string>
        user_ids: Set<string>
      }>()

      for (const failure of authFailures || []) {
        const ip = failure.ip_address || 'unknown'
        if (!ipFailureCounts.has(ip)) {
          ipFailureCounts.set(ip, {
            count: 0,
            company_ids: new Set(),
            user_ids: new Set()
          })
        }
        const data = ipFailureCounts.get(ip)!
        data.count++
        if (failure.company_id) data.company_ids.add(failure.company_id)
        if (failure.user_id) data.user_ids.add(failure.user_id)
      }

      // Flag IPs with >20 failures
      for (const [ip, data] of Array.from(ipFailureCounts.entries())) {
        if (data.count > 20) {
          // Create alert for each affected company
          for (const companyId of Array.from(data.company_ids)) {
            alerts.push({
              company_id: companyId,
              alert_type: 'BRUTE_FORCE_ATTACK',
              severity: data.count > 100 ? 'CRITICAL' : 'HIGH',
              title: 'Potential Brute Force Attack Detected',
              description: `IP address ${ip} made ${data.count} failed authentication attempts in ${lookbackHours} hours, targeting users from your company. This may indicate a brute force attack.`,
              trigger_data: {
                ip_address: ip,
                failure_count: data.count,
                time_period_hours: lookbackHours,
                affected_user_count: data.user_ids.size
              },
              affected_users: Array.from(data.user_ids)
            })
          }
        }
      }

    } catch (error) {
      console.error('Error in detectAuthAnomalies:', error)
    }

    return alerts
  }

  /**
   * Detect suspicious IP address patterns
   */
  private async detectSuspiciousIPs(lookbackHours: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

      // Look for IPs accessing multiple companies
      const { data: ipAccess, error } = await supabaseAdmin
        .from('audit_logs')
        .select('ip_address, company_id, user_id')
        .gte('created_at', cutoffTime)
        .not('ip_address', 'is', null)
        .not('company_id', 'is', null)

      if (error) {
        console.error('Error detecting suspicious IPs:', error)
        return alerts
      }

      // Group by IP and check company access patterns
      const ipCompanyMap = new Map<string, Set<string>>()
      const ipUserMap = new Map<string, Set<string>>()

      for (const access of ipAccess || []) {
        const ip = access.ip_address
        
        if (!ipCompanyMap.has(ip)) {
          ipCompanyMap.set(ip, new Set())
          ipUserMap.set(ip, new Set())
        }
        
        ipCompanyMap.get(ip)!.add(access.company_id)
        if (access.user_id) {
          ipUserMap.get(ip)!.add(access.user_id)
        }
      }

      // Flag IPs accessing multiple companies (could indicate compromise)
      for (const [ip, companies] of Array.from(ipCompanyMap.entries())) {
        if (companies.size > 1) {
          const companyArray = Array.from(companies)
          
          // Create alert for each company
          for (const companyId of companyArray) {
            alerts.push({
              company_id: companyId,
              alert_type: 'SUSPICIOUS_IP_PATTERN',
              severity: 'MEDIUM',
              title: 'IP Address Accessing Multiple Companies',
              description: `IP address ${ip} has accessed data from ${companies.size} different companies in ${lookbackHours} hours. This may indicate a compromised account or unauthorized access.`,
              trigger_data: {
                ip_address: ip,
                company_count: companies.size,
                companies_accessed: companyArray,
                user_count: ipUserMap.get(ip)?.size || 0
              },
              affected_users: Array.from(ipUserMap.get(ip) || [])
            })
          }
        }
      }

    } catch (error) {
      console.error('Error in detectSuspiciousIPs:', error)
    }

    return alerts
  }

  /**
   * Detect privilege escalation attempts
   */
  private async detectPrivilegeEscalation(lookbackHours: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

      // Look for role changes in audit logs
      const { data: roleChanges, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('created_at', cutoffTime)
        .eq('table_name', 'users')
        .eq('action', 'UPDATE')
        .not('changed_fields', 'is', null)

      if (error) {
        console.error('Error detecting privilege escalation:', error)
        return alerts
      }

      for (const change of roleChanges || []) {
        // Check if role was changed in the audit log
        if (change.changed_fields?.includes('role')) {
          const oldRole = change.old_data?.role
          const newRole = change.new_data?.role
          
          // Flag privilege escalations (viewer -> pm/admin, pm -> admin)
          const isEscalation = 
            (oldRole === 'viewer' && ['pm', 'admin'].includes(newRole)) ||
            (oldRole === 'pm' && newRole === 'admin') ||
            (oldRole === 'validator' && ['pm', 'admin'].includes(newRole))

          if (isEscalation) {
            alerts.push({
              company_id: change.company_id,
              alert_type: 'PRIVILEGE_ESCALATION',
              severity: newRole === 'admin' ? 'HIGH' : 'MEDIUM',
              title: 'User Privilege Escalation Detected',
              description: `User role was changed from ${oldRole} to ${newRole}. Please verify this change was authorized and legitimate.`,
              trigger_data: {
                target_user_id: change.record_id,
                old_role: oldRole,
                new_role: newRole,
                changed_by_user_id: change.user_id,
                change_timestamp: change.created_at
              },
              affected_users: change.record_id ? [change.record_id] : []
            })
          }
        }
      }

    } catch (error) {
      console.error('Error in detectPrivilegeEscalation:', error)
    }

    return alerts
  }

  /**
   * Store security alerts in the database
   */
  private async storeSecurityAlerts(alerts: SecurityAlert[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('security_alerts')
        .insert(alerts)

      if (error) {
        console.error('Error storing security alerts:', error)
        throw error
      }

      console.log(`Stored ${alerts.length} security alerts`)
    } catch (error) {
      console.error('Error in storeSecurityAlerts:', error)
      throw error
    }
  }

  /**
   * Get security metrics for a company
   */
  async getSecurityMetrics(companyId: string, periodHours: number = 24): Promise<SecurityMetrics> {
    try {
      const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

      // Get audit log statistics
      const { data: auditStats, error } = await supabaseAdmin
        .from('audit_logs')
        .select('event_type, risk_level, ip_address')
        .eq('company_id', companyId)
        .gte('created_at', cutoffTime)

      if (error) {
        console.error('Error getting security metrics:', error)
        throw error
      }

      const stats = auditStats || []
      
      // Calculate metrics
      const totalRequests = stats.length
      const failedAuthAttempts = stats.filter(s => 
        s.event_type.includes('AUTH') && s.risk_level !== 'LOW'
      ).length
      const crossCompanyAttempts = stats.filter(s => 
        s.event_type === 'CROSS_COMPANY_ACCESS_ATTEMPT'
      ).length
      const bulkAccessAttempts = stats.filter(s => 
        s.event_type === 'BULK_DATA_ACCESS'
      ).length
      const uniqueIPs = new Set(stats.map(s => s.ip_address).filter(Boolean)).size

      // Calculate risk score (0-100)
      let riskScore = 0
      riskScore += crossCompanyAttempts * 20 // Cross-company access is very risky
      riskScore += failedAuthAttempts * 2    // Failed auth attempts
      riskScore += bulkAccessAttempts * 10   // Bulk access attempts
      riskScore += Math.max(0, uniqueIPs - 5) * 1 // Many unique IPs can be suspicious

      // Cap at 100
      riskScore = Math.min(100, riskScore)

      return {
        company_id: companyId,
        period_hours: periodHours,
        total_requests: totalRequests,
        failed_auth_attempts: failedAuthAttempts,
        cross_company_attempts: crossCompanyAttempts,
        bulk_access_attempts: bulkAccessAttempts,
        unusual_ip_addresses: uniqueIPs,
        risk_score: riskScore
      }

    } catch (error) {
      console.error('Error in getSecurityMetrics:', error)
      throw error
    }
  }

  /**
   * Get active security alerts for a company
   */
  async getActiveAlerts(companyId: string): Promise<SecurityAlert[]> {
    try {
      const { data: alerts, error } = await supabaseAdmin
        .from('security_alerts')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting active alerts:', error)
        throw error
      }

      return alerts || []
    } catch (error) {
      console.error('Error in getActiveAlerts:', error)
      throw error
    }
  }

  /**
   * Mark a security alert as resolved
   */
  async resolveAlert(
    alertId: string, 
    resolverId: string, 
    resolutionNotes: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('security_alerts')
        .update({
          status: 'RESOLVED',
          assigned_to: resolverId,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) {
        console.error('Error resolving alert:', error)
        throw error
      }

      console.log(`Security alert ${alertId} resolved by ${resolverId}`)
    } catch (error) {
      console.error('Error in resolveAlert:', error)
      throw error
    }
  }
}

// Export singleton instance
export const securityMonitoringService = new SecurityMonitoringService()