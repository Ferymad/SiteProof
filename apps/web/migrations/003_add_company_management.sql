-- Story 1.2: User Authentication & Company Management
-- Migration: Add companies and user profiles tables for multi-tenant architecture

-- Create companies table with multi-tenancy support
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('subcontractor', 'main_contractor', 'validator')),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'trial',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with company relationship and roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'pm', 'validator', 'viewer')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update whatsapp_submissions to reference companies table
-- Add company_id column for multi-tenant data isolation
ALTER TABLE whatsapp_submissions 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_company_id ON whatsapp_submissions(company_id);

-- Enable Row Level Security for multi-tenant isolation
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
-- Company admins can view/manage their own company
CREATE POLICY "Company admins can view their own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.company_id = companies.id 
      AND users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Company admins can update their own company" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.company_id = companies.id 
      AND users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for users table  
-- Users can view other users in their company
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Company admins can manage users in their company
CREATE POLICY "Company admins can manage users in their company" ON users
  FOR ALL USING (
    company_id = (
      SELECT u.company_id FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Update RLS policies for whatsapp_submissions to include company isolation
DROP POLICY IF EXISTS "Users can view their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON whatsapp_submissions;

-- New company-aware policies for whatsapp_submissions
CREATE POLICY "Users can view submissions in their company" ON whatsapp_submissions
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert submissions for their company" ON whatsapp_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update submissions in their company" ON whatsapp_submissions
  FOR UPDATE USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own submissions" ON whatsapp_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for companies table
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Multi-tenant companies with subscription tiers and settings';
COMMENT ON TABLE users IS 'Company users with role-based access control';
COMMENT ON COLUMN companies.type IS 'Company type: subcontractor, main_contractor, or validator';
COMMENT ON COLUMN companies.subscription_tier IS 'Subscription level: trial, basic, premium, enterprise';
COMMENT ON COLUMN users.role IS 'User role: admin (full access), pm (project manager), validator (validation tasks), viewer (read-only)';
COMMENT ON COLUMN whatsapp_submissions.company_id IS 'Company isolation for multi-tenant data security';