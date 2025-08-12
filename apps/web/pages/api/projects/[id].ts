import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { 
  requirePermission, 
  extractTokenFromRequest,
  createAuthErrorResponse 
} from '@/lib/permissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  if (req.method === 'GET') {
    return handleGetProject(req, res, id)
  } else if (req.method === 'PATCH') {
    return handleUpdateProject(req, res, id)
  } else if (req.method === 'DELETE') {
    return handleDeleteProject(req, res, id)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetProject(req: NextApiRequest, res: NextApiResponse, projectId: string) {
  try {
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get project with company access check
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        whatsapp_messages (
          count
        ),
        whatsapp_submissions (
          count
        )
      `)
      .eq('id', projectId)
      .eq('company_id', (
        await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
      ).data?.company_id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Project not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch project' })
    }

    return res.status(200).json(project)
  } catch (error) {
    console.error('Get project API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdateProject(req: NextApiRequest, res: NextApiResponse, projectId: string) {
  try {
    
    // Verify user authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.company_id) {
      return res.status(403).json({ error: 'Company access required' })
    }

    // Check permissions - only admins and PMs can update projects
    if (!['admin', 'pm'].includes(userProfile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to update projects' })
    }

    const { name, location, start_date, end_date, metadata, status } = req.body

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name?.trim()) updateData.name = name.trim()
    if (location?.trim()) updateData.location = location.trim()
    if (start_date) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date || null
    if (metadata) updateData.metadata = metadata
    if (status) updateData.status = status

    // Validate dates if provided
    if (updateData.end_date && updateData.start_date && 
        new Date(updateData.end_date) < new Date(updateData.start_date)) {
      return res.status(400).json({ error: 'End date must be after start date' })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('company_id', userContext.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Project not found' })
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: 'A project with this name already exists' })
      }
      return res.status(500).json({ error: 'Failed to update project' })
    }

    return res.status(200).json(project)
  } catch (error) {
    console.error('Update project API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDeleteProject(req: NextApiRequest, res: NextApiResponse, projectId: string) {
  try {
    
    // Verify user authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.company_id) {
      return res.status(403).json({ error: 'Company access required' })
    }

    // Check permissions - only admins can delete projects
    if (userProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete projects' })
    }

    // Archive instead of delete to preserve data integrity
    const { data: project, error } = await supabase
      .from('projects')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('company_id', userContext.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error archiving project:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Project not found' })
      }
      return res.status(500).json({ error: 'Failed to archive project' })
    }

    return res.status(200).json({ message: 'Project archived successfully', project })
  } catch (error) {
    console.error('Delete project API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}