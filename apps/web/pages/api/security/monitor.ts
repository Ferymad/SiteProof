import { NextApiRequest, NextApiResponse } from 'next'
import { securityMonitoringService } from '@/lib/services/security-monitoring.service'

/**
 * Security Monitoring Cron Job Endpoint
 * Runs automated security analysis and breach detection
 * Story 1.2 Task 5: Multi-tenant security implementation
 * 
 * This endpoint should be called by:
 * - Vercel Cron Jobs
 * - GitHub Actions (scheduled)  
 * - External monitoring service
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify the request is from an authorized source
    const authHeader = req.headers.authorization
    const expectedToken = process.env.SECURITY_MONITOR_TOKEN

    if (!expectedToken) {
      console.error('SECURITY_MONITOR_TOKEN not configured')
      return res.status(500).json({ error: 'Security monitoring not configured' })
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized security monitoring request:', {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const startTime = Date.now()
    
    // Run security analysis for different time periods
    const analyses = await Promise.allSettled([
      // Last hour (critical issues)
      securityMonitoringService.runSecurityAnalysis(1),
      
      // Last 4 hours (pattern detection)
      securityMonitoringService.runSecurityAnalysis(4),
      
      // Last 24 hours (trend analysis)
      securityMonitoringService.runSecurityAnalysis(24)
    ])

    const results = {
      execution_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      analyses: {
        last_hour: analyses[0].status === 'fulfilled' ? analyses[0].value : [],
        last_4_hours: analyses[1].status === 'fulfilled' ? analyses[1].value : [],
        last_24_hours: analyses[2].status === 'fulfilled' ? analyses[2].value : []
      },
      errors: analyses
        .filter(a => a.status === 'rejected')
        .map(a => (a as PromiseRejectedResult).reason.message)
    }

    // Calculate total alerts generated
    const totalAlerts = Object.values(results.analyses)
      .flat()
      .length

    console.log(`Security monitoring completed: ${totalAlerts} alerts generated in ${results.execution_time_ms}ms`)

    // If critical alerts were found, we could send notifications here
    const criticalAlerts = Object.values(results.analyses)
      .flat()
      .filter(alert => alert.severity === 'CRITICAL')

    if (criticalAlerts.length > 0) {
      console.warn(`CRITICAL SECURITY ALERTS DETECTED: ${criticalAlerts.length} alerts`)
      // In production, send to incident management system, Slack, etc.
    }

    return res.status(200).json({
      status: 'success',
      message: `Security analysis completed: ${totalAlerts} alerts generated`,
      ...results
    })

  } catch (error: unknown) {
    console.error('Security monitoring error:', error)
    
    return res.status(500).json({
      status: 'error',
      error: 'Security monitoring failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Example Vercel cron configuration (add to vercel.json):
 * 
 * {
 *   "crons": [{
 *     "path": "/api/security/monitor",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * Example GitHub Actions workflow:
 * 
 * name: Security Monitoring
 * on:
 *   schedule:
 *     - cron: '0 * * * *'  # Every hour
 * jobs:
 *   security_check:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - name: Run security monitoring
 *         run: |
 *           curl -X POST \
 *             -H "Authorization: Bearer ${{ secrets.SECURITY_MONITOR_TOKEN }}" \
 *             https://your-domain.com/api/security/monitor
 */