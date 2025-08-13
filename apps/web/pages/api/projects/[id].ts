import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { 
  requirePermission, 
  extractTokenFromRequest,
  createAuthErrorResponse 
} from '@/lib/permissions'
import {
  validateProjectName,
  validateLocation,
  validateDate,
  validateMetadata
} from '@/lib/validation'

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
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Verify user authentication - any authenticated user can view projects
    const userContext = await requirePermission(token, 'VIEW_PROJECTS')

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
      .eq('company_id', userContext.company_id)
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
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Require project management permission - only admins and PMs can update projects
    const userContext = await requirePermission(token, 'MANAGE_PROJECTS')

    const { name, location, start_date, end_date, metadata, status } = req.body

    // Build update object with validation
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    
    if (name !== undefined) {
      const nameValidation = validateProjectName(name)
      if (!nameValidation.isValid) {
        return res.status(400).json({ error: nameValidation.error })
      }
      updateData.name = nameValidation.sanitized
    }
    
    if (location !== undefined) {
      const locationValidation = validateLocation(location)
      if (!locationValidation.isValid) {
        return res.status(400).json({ error: locationValidation.error })
      }
      updateData.location = locationValidation.sanitized
    }
    
    if (start_date !== undefined) {
      const dateValidation = validateDate(start_date)
      if (!dateValidation.isValid) {
        return res.status(400).json({ error: dateValidation.error })
      }
      updateData.start_date = start_date
    }
    
    if (end_date !== undefined) {
      if (end_date) {
        const dateValidation = validateDate(end_date)
        if (!dateValidation.isValid) {
          return res.status(400).json({ error: `End date: ${dateValidation.error}` })
        }
      }
      updateData.end_date = end_date || null
    }
    
    if (metadata !== undefined) {
      const metadataValidation = validateMetadata(metadata)
      if (!metadataValidation.isValid) {
        return res.status(400).json({ error: metadataValidation.error })
      }
      updateData.metadata = metadataValidation.sanitized
    }
    
    if (status) updateData.status = status

    // Validate dates if provided
    if (updateData.end_date && updateData.start_date && 
        new Date(updateData.end_date as string) < new Date(updateData.start_date as string)) {
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
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Check permissions - only admins can delete projects
    // This will check if user has admin role for project deletion
    const userContext = await requirePermission(token, 'MANAGE_PROJECTS')
    
    if (userContext.role !== 'admin') {
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