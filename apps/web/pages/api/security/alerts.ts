import { NextApiRequest, NextApiResponse } from 'next'
import { withSecurity, SecurityContext } from '@/lib/api-security-middleware'
import { securityMonitoringService } from '@/lib/services/security-monitoring.service'

/**
 * Security Alerts API Endpoint
 * Allows company admins to view and manage security alerts
 * Story 1.2 Task 5: Multi-tenant security implementation
 */

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  context: SecurityContext
) {
  const { userContext } = context

  // Only admins can access security alerts
  if (userContext.role !== 'admin') {
    return res.status(403).json({
      error: 'Only company administrators can access security alerts',
      code: 'ADMIN_REQUIRED'
    })
  }

  try {
    if (req.method === 'GET') {
      // Get active security alerts for the company
      const alerts = await securityMonitoringService.getActiveAlerts(userContext.company_id)
      
      // Get security metrics
      const metrics = await securityMonitoringService.getSecurityMetrics(
        userContext.company_id,
        24 // Last 24 hours
      )

      return res.status(200).json({
        alerts,
        metrics,
        company_id: userContext.company_id
      })
    }

    if (req.method === 'PATCH') {
      // Resolve a security alert
      const { alert_id, resolution_notes } = req.body

      if (!alert_id || !resolution_notes) {
        return res.status(400).json({
          error: 'alert_id and resolution_notes are required',
          code: 'MISSING_REQUIRED_FIELDS'
        })
      }

      // Verify the alert belongs to this company
      const alerts = await securityMonitoringService.getActiveAlerts(userContext.company_id)
      const alert = alerts.find(a => a.id === alert_id)
      
      if (!alert) {
        return res.status(404).json({
          error: 'Security alert not found or does not belong to your company',
          code: 'ALERT_NOT_FOUND'
        })
      }

      // Resolve the alert
      await securityMonitoringService.resolveAlert(
        alert_id,
        userContext.id,
        resolution_notes
      )

      return res.status(200).json({
        message: 'Security alert resolved successfully',
        alert_id
      })
    }

    if (req.method === 'POST') {
      // Trigger manual security analysis
      const { lookback_hours = 1 } = req.body

      const newAlerts = await securityMonitoringService.runSecurityAnalysis(lookback_hours)
      
      return res.status(200).json({
        message: 'Security analysis completed',
        new_alerts_count: newAlerts.length,
        new_alerts: newAlerts
      })
    }

    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })

  } catch (error: unknown) {
    console.error('Security alerts API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Apply security middleware with audit logging
export default withSecurity(handler, {
  requiredPermission: 'API_COMPANY_READ',
  auditEvent: 'SECURITY_ALERTS_ACCESS',
  rateLimit: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 1 minute
  }
})