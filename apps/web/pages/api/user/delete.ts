import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { 
  requirePermission, 
  extractTokenFromRequest,
  createPermissionErrorResponse,
  createAuthErrorResponse 
} from '@/lib/permissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Require user to be authenticated (any role can delete their own account)
    const userContext = await requirePermission(token, 'EDIT_OWN_PROFILE')

    // Check if user is the only admin in their company
    if (userContext.role === 'admin') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('company_id', userContext.company_id)
        .eq('role', 'admin')

      if (adminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot delete account. You are the only admin in your company. Please assign another admin first or contact support.',
          code: 'LAST_ADMIN_PROTECTION'
        })
      }
    }

    // Perform account deletion
    await deleteUserAccount(userContext.id, userContext.company_id)

    // Log the deletion for audit purposes
    console.log(`User account deleted: ${userContext.id} from company ${userContext.company_id}`)

    return res.status(200).json({ 
      message: 'Account successfully deleted',
      deleted_user_id: userContext.id
    })

  } catch (error: any) {
    console.error('Account deletion error:', error)
    
    if (error.message.includes('Authentication required')) {
      const authError = createAuthErrorResponse(error.message)
      return res.status(authError.status).json(authError)
    }
    
    if (error.message.includes('Insufficient permissions')) {
      const permError = createPermissionErrorResponse(error.message)
      return res.status(permError.status).json(permError)
    }

    if (error.message.includes('LAST_ADMIN_PROTECTION')) {
      return res.status(400).json({ 
        error: error.message,
        code: 'LAST_ADMIN_PROTECTION'
      })
    }
    
    return res.status(500).json({ error: 'Account deletion failed' })
  }
}

async function deleteUserAccount(userId: string, companyId: string) {
  // Use a transaction-like approach to ensure data consistency
  try {
    // 1. Delete user's submissions first (due to foreign key constraints)
    const { error: submissionsError } = await supabase
      .from('whatsapp_submissions')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (submissionsError) {
      console.warn('Error deleting user submissions:', submissionsError)
      // Continue with deletion as this might not be critical
    }

    // 2. Delete user profile photos from storage if they exist
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (userProfile?.preferences?.profile_photo_url) {
        const photoUrl = userProfile.preferences.profile_photo_url
        const urlParts = photoUrl.split('profile-photos/')
        if (urlParts.length > 1) {
          const filePath = `profile-photos/${urlParts[1]}`
          await supabase.storage
            .from('profile-photos')
            .remove([filePath])
        }
      }
    } catch (error) {
      console.warn('Error deleting profile photo:', error)
      // Continue with deletion
    }

    // 3. Delete the user record (this will cascade to related records if properly set up)
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('company_id', companyId) // Extra safety check

    if (userError) {
      throw new Error(`Failed to delete user record: ${userError.message}`)
    }

    // 4. Delete the user from Supabase Auth
    // Note: This requires service_role key and should be done carefully
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.warn('Error deleting auth user:', authError)
      // Log but don't throw - the database user is already deleted
    }

  } catch (error) {
    console.error('Error in deleteUserAccount:', error)
    throw error
  }
}

// Helper function to anonymize rather than delete (alternative approach)
async function anonymizeUserAccount(userId: string, companyId: string) {
  const anonymizedData = {
    name: 'Deleted User',
    email: `deleted-user-${userId}@anonymized.local`,
    preferences: {
      anonymized: true,
      anonymized_at: new Date().toISOString()
    }
  }

  const { error } = await supabase
    .from('users')
    .update(anonymizedData)
    .eq('id', userId)
    .eq('company_id', companyId)

  if (error) {
    throw new Error(`Failed to anonymize user: ${error.message}`)
  }

  // Also anonymize submissions
  const { error: submissionError } = await supabase
    .from('whatsapp_submissions')
    .update({
      whatsapp_text: '[REDACTED]',
      voice_file_path: null,
      transcription: '[REDACTED]'
    })
    .eq('user_id', userId)

  if (submissionError) {
    console.warn('Error anonymizing submissions:', submissionError)
  }
}