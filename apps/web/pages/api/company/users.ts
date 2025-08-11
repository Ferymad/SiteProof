import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { 
  requirePermission, 
  extractTokenFromRequest,
  createPermissionErrorResponse,
  createAuthErrorResponse 
} from '@/lib/permissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Require user management permission for all operations
    const userContext = await requirePermission(token, 'MANAGE_USERS')

    if (req.method === 'GET') {
      // Get all users in the company
      const { data: companyUsers, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('company_id', userContext.company_id)
        .order('created_at', { ascending: true })

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch users' })
      }

      return res.status(200).json({ users: companyUsers })
    }

    if (req.method === 'PATCH') {
      // Update user role
      const { user_id, new_role } = req.body

      if (!user_id || !new_role) {
        return res.status(400).json({ error: 'user_id and new_role are required' })
      }

      // Validate role
      const validRoles = ['admin', 'pm', 'validator', 'viewer']
      if (!validRoles.includes(new_role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }

      // Prevent admin from demoting themselves if they're the only admin
      if (user_id === userContext.id && new_role !== 'admin') {
        const { count: adminCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('company_id', userContext.company_id)
          .eq('role', 'admin')

        if (adminCount === 1) {
          return res.status(400).json({ error: 'Cannot demote the only admin. Promote another user to admin first.' })
        }
      }

      // Verify the user being updated is in the same company
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user_id)
        .single()

      if (targetError || !targetUser || targetUser.company_id !== userContext.company_id) {
        return res.status(404).json({ error: 'User not found in your company' })
      }

      // Update the user's role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: new_role })
        .eq('id', user_id)
        .eq('company_id', userContext.company_id)

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update user role' })
      }

      // Fetch updated user data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('id', user_id)
        .single()

      if (fetchError) {
        return res.status(500).json({ error: 'Failed to fetch updated user' })
      }

      return res.status(200).json({ user: updatedUser })
    }

    if (req.method === 'DELETE') {
      // Remove user from company (only for non-admin users)
      const { user_id } = req.body

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' })
      }

      // Prevent admin from removing themselves
      if (user_id === userContext.id) {
        return res.status(400).json({ error: 'Cannot remove yourself from the company' })
      }

      // Verify the user being removed is in the same company and not an admin
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user_id)
        .single()

      if (targetError || !targetUser || targetUser.company_id !== userContext.company_id) {
        return res.status(404).json({ error: 'User not found in your company' })
      }

      if (targetUser.role === 'admin') {
        return res.status(400).json({ error: 'Cannot remove another admin. Change their role first.' })
      }

      // Remove user from company by setting company_id to null
      const { error: removeError } = await supabase
        .from('users')
        .update({ company_id: null })
        .eq('id', user_id)

      if (removeError) {
        return res.status(500).json({ error: 'Failed to remove user from company' })
      }

      return res.status(200).json({ message: 'User removed from company successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('Company users API error:', error)
    
    // Handle permission and auth errors gracefully
    if (error instanceof Error && error.message.includes('Authentication required')) {
      const authError = createAuthErrorResponse(error.message)
      return res.status(authError.status).json(authError)
    }
    
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      const permError = createPermissionErrorResponse(error.message)
      return res.status(permError.status).json(permError)
    }
    
    return res.status(500).json({ error: 'Internal server error' })
  }
}