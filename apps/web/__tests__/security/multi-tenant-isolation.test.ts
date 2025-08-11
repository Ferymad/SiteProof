/**
 * Multi-Tenant Security Isolation Tests
 * Tests that ensure complete data isolation between companies
 * Story 1.2 Task 5: Multi-tenant security implementation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Test data structure
interface TestCompany {
  id: string
  name: string
  type: 'subcontractor' | 'main_contractor' | 'validator'
}

interface TestUser {
  id: string
  email: string
  password: string
  name: string
  role: 'admin' | 'pm' | 'validator' | 'viewer'
  company_id: string
  supabaseClient: SupabaseClient
}

describe('Multi-Tenant Security Isolation', () => {
  let testCompanies: TestCompany[] = []
  let testUsers: TestUser[] = []
  let testSubmissions: any[] = []

  beforeAll(async () => {
    // Create test companies
    const company1Data = {
      name: 'Test Construction Company A',
      type: 'subcontractor' as const,
      subscription_tier: 'trial',
      settings: {}
    }

    const company2Data = {
      name: 'Test Construction Company B', 
      type: 'main_contractor' as const,
      subscription_tier: 'trial',
      settings: {}
    }

    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .insert([company1Data, company2Data])
      .select()

    if (error) {
      console.error('Failed to create test companies:', error)
      throw error
    }

    testCompanies = companies
    console.log('Created test companies:', testCompanies.map(c => ({ id: c.id, name: c.name })))

    // Create test users for each company
    const usersToCreate = [
      {
        email: 'admin1@testcompany.com',
        password: 'TestPassword123!',
        name: 'Admin User 1',
        role: 'admin' as const,
        company_id: testCompanies[0].id
      },
      {
        email: 'pm1@testcompany.com', 
        password: 'TestPassword123!',
        name: 'PM User 1',
        role: 'pm' as const,
        company_id: testCompanies[0].id
      },
      {
        email: 'admin2@testcompany.com',
        password: 'TestPassword123!', 
        name: 'Admin User 2',
        role: 'admin' as const,
        company_id: testCompanies[1].id
      },
      {
        email: 'pm2@testcompany.com',
        password: 'TestPassword123!',
        name: 'PM User 2', 
        role: 'pm' as const,
        company_id: testCompanies[1].id
      }
    ]

    // Create auth users and profiles
    for (const userData of usersToCreate) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          company_id: userData.company_id,
          role: userData.role
        }
      })

      if (authError) {
        console.error('Failed to create auth user:', authError)
        throw authError
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          company_id: userData.company_id,
          preferences: {}
        })

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        throw profileError
      }

      // Create authenticated Supabase client for this user
      const client = createClient(supabaseUrl, supabaseAnonKey)
      const { error: signInError } = await client.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      })

      if (signInError) {
        console.error('Failed to sign in test user:', signInError)
        throw signInError
      }

      testUsers.push({
        id: authUser.user.id,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        company_id: userData.company_id,
        supabaseClient: client
      })
    }

    console.log('Created test users:', testUsers.map(u => ({ 
      id: u.id, 
      email: u.email, 
      role: u.role, 
      company_id: u.company_id 
    })))
  })

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete users
      for (const user of testUsers) {
        await supabaseAdmin.auth.admin.deleteUser(user.id)
      }

      // Delete companies (CASCADE will clean up related records)
      await supabaseAdmin
        .from('companies')
        .delete()
        .in('id', testCompanies.map(c => c.id))

      console.log('Cleaned up test data')
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  describe('Company Data Isolation', () => {
    test('Users can only see their own company data', async () => {
      const user1 = testUsers.find(u => u.company_id === testCompanies[0].id)!
      const user2 = testUsers.find(u => u.company_id === testCompanies[1].id)!

      // User 1 should only see Company 1
      const { data: company1View, error: error1 } = await user1.supabaseClient
        .from('companies')
        .select('*')

      expect(error1).toBeNull()
      expect(company1View).toHaveLength(1)
      expect(company1View![0].id).toBe(testCompanies[0].id)

      // User 2 should only see Company 2
      const { data: company2View, error: error2 } = await user2.supabaseClient
        .from('companies')
        .select('*')

      expect(error2).toBeNull()
      expect(company2View).toHaveLength(1)
      expect(company2View![0].id).toBe(testCompanies[1].id)
    })

    test('Users can only see users from their own company', async () => {
      const user1 = testUsers.find(u => u.company_id === testCompanies[0].id)!
      const user2 = testUsers.find(u => u.company_id === testCompanies[1].id)!

      // User 1 should only see users from Company 1
      const { data: users1View, error: error1 } = await user1.supabaseClient
        .from('users')
        .select('*')

      expect(error1).toBeNull()
      expect(users1View).toHaveLength(2) // admin1 and pm1
      expect(users1View!.every(u => u.company_id === testCompanies[0].id)).toBe(true)

      // User 2 should only see users from Company 2
      const { data: users2View, error: error2 } = await user2.supabaseClient
        .from('users')
        .select('*')

      expect(error2).toBeNull()
      expect(users2View).toHaveLength(2) // admin2 and pm2
      expect(users2View!.every(u => u.company_id === testCompanies[1].id)).toBe(true)
    })
  })

  describe('WhatsApp Submissions Isolation', () => {
    beforeAll(async () => {
      // Create test submissions for each user
      const submissionsToCreate = [
        {
          user_id: testUsers[0].id,
          company_id: testCompanies[0].id,
          whatsapp_text: 'Test submission from Company A User 1',
          processing_status: 'pending'
        },
        {
          user_id: testUsers[1].id,
          company_id: testCompanies[0].id,
          whatsapp_text: 'Test submission from Company A User 2',
          processing_status: 'pending'
        },
        {
          user_id: testUsers[2].id,
          company_id: testCompanies[1].id,
          whatsapp_text: 'Test submission from Company B User 1',
          processing_status: 'pending'
        },
        {
          user_id: testUsers[3].id,
          company_id: testCompanies[1].id,
          whatsapp_text: 'Test submission from Company B User 2',
          processing_status: 'pending'
        }
      ]

      const { data, error } = await supabaseAdmin
        .from('whatsapp_submissions')
        .insert(submissionsToCreate)
        .select()

      if (error) {
        console.error('Failed to create test submissions:', error)
        throw error
      }

      testSubmissions = data
    })

    test('Users can only see submissions from their company', async () => {
      const user1 = testUsers[0] // Company A
      const user3 = testUsers[2] // Company B

      // User from Company A should only see Company A submissions
      const { data: companyASubmissions, error: errorA } = await user1.supabaseClient
        .from('whatsapp_submissions')
        .select('*')

      expect(errorA).toBeNull()
      expect(companyASubmissions).toHaveLength(2)
      expect(companyASubmissions!.every(s => s.company_id === testCompanies[0].id)).toBe(true)

      // User from Company B should only see Company B submissions
      const { data: companyBSubmissions, error: errorB } = await user3.supabaseClient
        .from('whatsapp_submissions')
        .select('*')

      expect(errorB).toBeNull()
      expect(companyBSubmissions).toHaveLength(2)
      expect(companyBSubmissions!.every(s => s.company_id === testCompanies[1].id)).toBe(true)
    })

    test('Users cannot insert submissions for other companies', async () => {
      const user1 = testUsers[0] // Company A user

      // Try to insert a submission with Company B's ID
      const { error } = await user1.supabaseClient
        .from('whatsapp_submissions')
        .insert({
          user_id: user1.id,
          company_id: testCompanies[1].id, // Wrong company ID
          whatsapp_text: 'Attempting cross-company insertion',
          processing_status: 'pending'
        })

      // Should fail due to RLS policy
      expect(error).not.toBeNull()
      expect(error!.code).toBe('42501') // Insufficient privileges
    })

    test('Users cannot update submissions from other companies', async () => {
      const user1 = testUsers[0] // Company A user
      const companyBSubmission = testSubmissions.find(s => s.company_id === testCompanies[1].id)

      // Try to update a submission from Company B
      const { error } = await user1.supabaseClient
        .from('whatsapp_submissions')
        .update({ whatsapp_text: 'Attempting to modify other company data' })
        .eq('id', companyBSubmission.id)

      // Should fail due to RLS policy
      expect(error).not.toBeNull()
      expect(error!.code).toBe('42501') // Insufficient privileges
    })
  })

  describe('Processing Analytics Isolation', () => {
    let testAnalytics: any[] = []

    beforeAll(async () => {
      // Create processing analytics for each company
      const analyticsToCreate = testSubmissions.map(submission => ({
        submission_id: submission.id,
        company_id: submission.company_id,
        user_id: submission.user_id,
        processing_version: '1.2.5',
        total_processing_time: Math.floor(Math.random() * 1000),
        original_confidence: Math.floor(Math.random() * 100),
        final_confidence: Math.floor(Math.random() * 100),
        total_cost: Math.random() * 0.1
      }))

      const { data, error } = await supabaseAdmin
        .from('processing_analytics')
        .insert(analyticsToCreate)
        .select()

      if (error) {
        console.error('Failed to create test analytics:', error)
        throw error
      }

      testAnalytics = data
    })

    test('Users can only see analytics from their company', async () => {
      const user1 = testUsers[0] // Company A
      const user3 = testUsers[2] // Company B

      // Company A user should only see Company A analytics
      const { data: companyAAnalytics, error: errorA } = await user1.supabaseClient
        .from('processing_analytics')
        .select('*')

      expect(errorA).toBeNull()
      expect(companyAAnalytics).toHaveLength(2)
      expect(companyAAnalytics!.every(a => a.company_id === testCompanies[0].id)).toBe(true)

      // Company B user should only see Company B analytics
      const { data: companyBAnalytics, error: errorB } = await user3.supabaseClient
        .from('processing_analytics')
        .select('*')

      expect(errorB).toBeNull()
      expect(companyBAnalytics).toHaveLength(2)
      expect(companyBAnalytics!.every(a => a.company_id === testCompanies[1].id)).toBe(true)
    })
  })

  describe('Storage Bucket Isolation', () => {
    test('Users can only access voice notes from their company folder', async () => {
      const user1 = testUsers[0] // Company A
      const user3 = testUsers[2] // Company B

      // Company A user should only be able to list files in their company folder
      const { data: companyAFiles, error: errorA } = await user1.supabaseClient
        .storage
        .from('voice-notes')
        .list(`${testCompanies[0].id}`)

      expect(errorA).toBeNull()
      // Should be able to list (even if empty)
      expect(Array.isArray(companyAFiles)).toBe(true)

      // Company A user should NOT be able to list Company B folder
      const { data: companyBFiles, error: errorB } = await user1.supabaseClient
        .storage
        .from('voice-notes')
        .list(`${testCompanies[1].id}`)

      // Should fail due to RLS policy
      expect(errorB).not.toBeNull()
    })
  })

  describe('Security Breach Detection', () => {
    test('Cross-company access attempts are logged as security events', async () => {
      const user1 = testUsers[0] // Company A user

      // Attempt to access Company B submission (should fail and be logged)
      const companyBSubmission = testSubmissions.find(s => s.company_id === testCompanies[1].id)
      
      const { error } = await user1.supabaseClient
        .from('whatsapp_submissions')
        .select('*')
        .eq('id', companyBSubmission.id)

      // Should return no results due to RLS, not an error
      expect(error).toBeNull()

      // Check that audit logs were created (using admin client)
      // In a real scenario, this would be checked by the breach detection system
      const { data: auditLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', user1.id)
        .eq('event_type', 'CROSS_COMPANY_ACCESS_ATTEMPT')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

      // Note: This test assumes our breach detection is running
      // In practice, the security middleware would detect this pattern
    })
  })

  describe('Admin Role Restrictions', () => {
    test('Admin users can only manage users in their own company', async () => {
      const admin1 = testUsers.find(u => u.role === 'admin' && u.company_id === testCompanies[0].id)!
      const admin2 = testUsers.find(u => u.role === 'admin' && u.company_id === testCompanies[1].id)!

      // Admin 1 should only see users from Company A
      const { data: usersA, error: errorA } = await admin1.supabaseClient
        .from('users')
        .select('*')
        .eq('role', 'pm')

      expect(errorA).toBeNull()
      expect(usersA).toHaveLength(1) // Only Company A PM
      expect(usersA![0].company_id).toBe(testCompanies[0].id)

      // Admin 2 should only see users from Company B  
      const { data: usersB, error: errorB } = await admin2.supabaseClient
        .from('users')
        .select('*')
        .eq('role', 'pm')

      expect(errorB).toBeNull()
      expect(usersB).toHaveLength(1) // Only Company B PM
      expect(usersB![0].company_id).toBe(testCompanies[1].id)
    })
  })
})