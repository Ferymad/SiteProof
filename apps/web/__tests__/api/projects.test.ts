import { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../pages/api/projects/index'
import { createServerSupabaseClient } from '../../lib/supabase-server'

// Mock Supabase client
jest.mock('../../lib/supabase-server')
const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<typeof createServerSupabaseClient>

describe('/api/projects', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let mockSupabase: any

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {}
    }
    res = {
      status: jest.fn(() => res) as any,
      json: jest.fn(() => res) as any
    }

    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      single: jest.fn()
    }

    mockCreateServerSupabaseClient.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { company_id: 'company-123', role: 'pm' },
        error: null
      })

      // Mock projects query
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          location: 'Dublin',
          company_id: 'company-123',
          status: 'active'
        }
      ]
      mockSupabase.single.mockResolvedValueOnce({
        data: mockProjects,
        error: null
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 403 for user without company', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('No profile')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Company access required' })
    })
  })

  describe('POST /api/projects', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = {
        name: 'New Project',
        location: 'Cork',
        start_date: '2025-01-01',
        metadata: { contractValue: 50000 }
      }
    })

    it('should create project for admin/pm user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { company_id: 'company-123', role: 'admin' },
        error: null
      })

      const mockNewProject = {
        id: 'project-new',
        name: 'New Project',
        location: 'Cork',
        company_id: 'company-123'
      }
      mockSupabase.single.mockResolvedValueOnce({
        data: mockNewProject,
        error: null
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        name: 'New Project',
        location: 'Cork',
        company_id: 'company-123',
        start_date: '2025-01-01',
        end_date: null,
        metadata: { contractValue: 50000 }
      }])
    })

    it('should return 403 for non-admin/pm user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { company_id: 'company-123', role: 'viewer' },
        error: null
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions to create projects' })
    })

    it('should return 400 for missing required fields', async () => {
      req.body = { name: '' } // Missing location and start_date

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { company_id: 'company-123', role: 'admin' },
        error: null
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Name, location, and start date are required' })
    })
  })

  describe('Method not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' })
    })
  })
})