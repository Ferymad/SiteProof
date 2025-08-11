import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { 
  requirePermission, 
  extractTokenFromRequest,
  createPermissionErrorResponse,
  createAuthErrorResponse 
} from '@/lib/permissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Require user to be authenticated (any role can export their own data)
    const userContext = await requirePermission(token, 'EDIT_OWN_PROFILE')

    // Collect all user data
    const userData = await collectUserData(userContext.id, userContext.company_id)

    // Create export filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `bmad-profile-${userContext.id}-${timestamp}.json`

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache')

    return res.status(200).json({
      export_info: {
        user_id: userContext.id,
        export_date: new Date().toISOString(),
        data_types: Object.keys(userData),
        company_id: userContext.company_id
      },
      ...userData
    })

  } catch (error: any) {
    console.error('Data export error:', error)
    
    if (error.message.includes('Authentication required')) {
      const authError = createAuthErrorResponse(error.message)
      return res.status(authError.status).json(authError)
    }
    
    if (error.message.includes('Insufficient permissions')) {
      const permError = createPermissionErrorResponse(error.message)
      return res.status(permError.status).json(permError)
    }
    
    return res.status(500).json({ error: 'Export failed' })
  }
}

async function collectUserData(userId: string, companyId: string) {
  const userData: any = {}

  try {
    // User profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError
    userData.profile = profile

    // User submissions (only their own)
    const { data: submissions, error: submissionsError } = await supabase
      .from('whatsapp_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (!submissionsError) {
      userData.submissions = submissions || []
    }

    // Company information (limited fields for privacy)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, type, created_at')
      .eq('id', companyId)
      .single()

    if (!companyError) {
      userData.company = company
    }

    // Activity log (if we had one)
    // This could include login history, profile changes, etc.
    userData.activity_summary = {
      profile_created: profile?.created_at,
      last_updated: new Date().toISOString(),
      submissions_count: submissions?.length || 0
    }

    // Privacy notice
    userData.privacy_notice = {
      message: "This export contains all personal data associated with your BMAD Construction account.",
      data_retention_policy: "Data is retained according to our privacy policy and applicable regulations.",
      contact_info: "For data privacy questions, contact privacy@bmadconstruction.com",
      your_rights: [
        "Right to rectification of inaccurate data",
        "Right to erasure (right to be forgotten)",
        "Right to restrict processing",
        "Right to data portability"
      ]
    }

  } catch (error) {
    console.error('Error collecting user data:', error)
    throw error
  }

  return userData
}