import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface RegisterCompanyRequest {
  company_name: string
  company_type: 'subcontractor' | 'main_contractor' | 'validator'
  admin_name: string
  admin_email: string
  admin_password: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      company_name,
      company_type,
      admin_name,
      admin_email,
      admin_password
    }: RegisterCompanyRequest = req.body

    // Validate required fields
    if (!company_name || !company_type || !admin_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(admin_email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate password length
    if (admin_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Validate company type
    if (!['subcontractor', 'main_contractor', 'validator'].includes(company_type)) {
      return res.status(400).json({ error: 'Invalid company type' })
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(user => user.email === admin_email)
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Start transaction - Create company first
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: company_name,
        type: company_type,
        subscription_tier: 'trial',
        settings: {}
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company creation error:', companyError)
      return res.status(500).json({ error: 'Failed to create company' })
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true, // Auto-confirm for admin users
      user_metadata: {
        name: admin_name,
        company_id: company.id,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      
      // Rollback: Delete the company if user creation failed
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      
      return res.status(500).json({ error: 'Failed to create admin user' })
    }

    // Create user profile in users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: admin_email,
        name: admin_name,
        role: 'admin',
        company_id: company.id,
        preferences: {}
      })
      .select()
      .single()

    if (profileError) {
      console.error('User profile creation error:', profileError)
      
      // Rollback: Delete auth user and company
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      
      return res.status(500).json({ error: 'Failed to create user profile' })
    }

    // Success - return company and user data
    res.status(201).json({
      company: {
        id: company.id,
        name: company.name,
        type: company.type,
        subscription_tier: company.subscription_tier
      },
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        company_id: userProfile.company_id
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}