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
  if (req.method === 'GET') {
    return handleGetProjects(req, res)
  } else if (req.method === 'POST') {
    return handleCreateProject(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetProjects(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Verify user authentication - any authenticated user can view projects
    const userContext = await requirePermission(token, 'VIEW_PROJECTS')

    // Build query
    let query = supabase
      .from('projects')
      .select('*')
      .eq('company_id', userContext.company_id)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    const { status } = req.query
    if (status && status !== '') {
      query = query.eq('status', status)
    }

    const { data: projects, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return res.status(500).json({ error: 'Failed to fetch projects' })
    }

    return res.status(200).json(projects || [])
  } catch (error) {
    console.error('Projects API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCreateProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      const error = createAuthErrorResponse()
      return res.status(error.status).json(error)
    }

    // Require project creation permission - only admins and PMs can create projects
    const userContext = await requirePermission(token, 'MANAGE_PROJECTS')

    const { name, location, start_date, end_date, metadata } = req.body

    // Validate and sanitize name
    const nameValidation = validateProjectName(name)
    if (!nameValidation.isValid) {
      return res.status(400).json({ error: nameValidation.error })
    }

    // Validate and sanitize location
    const locationValidation = validateLocation(location)
    if (!locationValidation.isValid) {
      return res.status(400).json({ error: locationValidation.error })
    }

    // Validate start date
    const startDateValidation = validateDate(start_date)
    if (!startDateValidation.isValid) {
      return res.status(400).json({ error: `Start date: ${startDateValidation.error}` })
    }

    // Validate end date if provided
    let validatedEndDate = null
    if (end_date) {
      const endDateValidation = validateDate(end_date)
      if (!endDateValidation.isValid) {
        return res.status(400).json({ error: `End date: ${endDateValidation.error}` })
      }
      validatedEndDate = endDateValidation.date
      
      // Ensure end date is after start date
      if (validatedEndDate && validatedEndDate < startDateValidation.date!) {
        return res.status(400).json({ error: 'End date must be after start date' })
      }
    }

    // Validate and sanitize metadata
    const metadataValidation = validateMetadata(metadata)
    if (!metadataValidation.isValid) {
      return res.status(400).json({ error: metadataValidation.error })
    }

    // Create project with sanitized data
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        name: nameValidation.sanitized,
        location: locationValidation.sanitized,
        company_id: userContext.company_id,
        start_date: startDateValidation.date!.toISOString().split('T')[0],
        end_date: validatedEndDate ? validatedEndDate.toISOString().split('T')[0] : null,
        metadata: metadataValidation.sanitized
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'A project with this name already exists' })
      }
      return res.status(500).json({ error: 'Failed to create project' })
    }

    return res.status(201).json(project)
  } catch (error) {
    console.error('Project creation API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}