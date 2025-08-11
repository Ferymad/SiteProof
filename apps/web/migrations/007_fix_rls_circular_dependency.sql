-- Story 1.2: Fix RLS Circular Dependency Issue
-- Migration: Resolve infinite recursion in Row Level Security policies
-- Root Cause: RLS policies query users table which itself has RLS policies

-- PROBLEM ANALYSIS:
-- Current RLS policies use: SELECT company_id FROM users WHERE id = auth.uid()
-- This creates circular dependency:
-- 1. To access users table, RLS checks users table policy
-- 2. Users table policy queries users table to get company_id
-- 3. This creates infinite recursion: users -> users -> users -> ...

-- SOLUTION: Use JWT claims to store company_id instead of database queries
-- When users sign in, company_id should be stored in JWT token as custom claim
-- RLS policies can then use: (auth.jwt() ->> 'company_id')::uuid

-- Step 1: Create function to get company_id from JWT or fallback to database
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company_id_claim UUID;
    user_company_id UUID;
BEGIN
    -- Try to get company_id from JWT claims first (preferred method)
    BEGIN
        company_id_claim := (auth.jwt() ->> 'company_id')::UUID;
        IF company_id_claim IS NOT NULL THEN
            RETURN company_id_claim;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed, fall back to database query
        NULL;
    END;
    
    -- Fallback: Direct database query (bypassing RLS for this specific query)
    -- This query is safe from recursion because it's in a SECURITY DEFINER function
    SELECT company_id INTO user_company_id 
    FROM users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_company_id;
END;
$$;

-- Step 2: Create function to check if user has admin role
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get role from JWT claims first
    BEGIN
        user_role := auth.jwt() ->> 'role';
        IF user_role = 'admin' THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Fallback: Direct database query (bypassing RLS)
    SELECT role INTO user_role 
    FROM users 
    WHERE id = auth.uid() 
    LIMIT 1;
    
    RETURN user_role = 'admin';
END;
$$;

-- Step 3: Drop all existing problematic RLS policies
-- Companies table policies
DROP POLICY IF EXISTS "Company admins can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their own company" ON companies;

-- Users table policies  
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Company admins can manage users in their company" ON users;

-- WhatsApp submissions policies
DROP POLICY IF EXISTS "Users can view submissions in their company" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can insert submissions for their company" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can update submissions in their company" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON whatsapp_submissions;

-- Processing analytics policies
DROP POLICY IF EXISTS "Users can view analytics in their company" ON processing_analytics;
DROP POLICY IF EXISTS "Users can insert analytics for their company" ON processing_analytics;

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view audit logs in their company" ON audit_logs;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload voice notes for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can view voice notes in their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice notes" ON storage.objects;

-- Step 4: Create new RLS policies using safe functions (no circular dependencies)

-- Companies table policies - Fixed
CREATE POLICY "Company admins can view their own company" ON companies
  FOR SELECT USING (id = get_user_company_id() AND user_is_admin());

CREATE POLICY "Company admins can update their own company" ON companies
  FOR UPDATE USING (id = get_user_company_id() AND user_is_admin());

-- Users table policies - Fixed  
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Company admins can manage users in their company" ON users
  FOR ALL USING (company_id = get_user_company_id() AND user_is_admin());

-- WhatsApp submissions policies - Fixed
CREATE POLICY "Users can view submissions in their company" ON whatsapp_submissions
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert submissions for their company" ON whatsapp_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "Users can update submissions in their company" ON whatsapp_submissions
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their own submissions" ON whatsapp_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Processing analytics policies - Fixed
CREATE POLICY "Users can view analytics in their company" ON processing_analytics
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert analytics for their company" ON processing_analytics
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Audit logs policies - Fixed
CREATE POLICY "Users can view audit logs in their company" ON audit_logs
  FOR SELECT USING (company_id = get_user_company_id());

-- Storage policies - Fixed
CREATE POLICY "Users can upload voice notes for their company" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = get_user_company_id()::text AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can view voice notes in their company" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Users can delete their own voice notes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = get_user_company_id()::text AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Step 5: Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_id ON companies(id);

-- Step 6: Add comments for future reference
COMMENT ON FUNCTION get_user_company_id() IS 'Safely retrieves user company_id from JWT claims or database, preventing RLS circular dependencies';
COMMENT ON FUNCTION user_is_admin() IS 'Safely checks if user has admin role from JWT claims or database, preventing RLS circular dependencies';

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_admin() TO authenticated;

-- Migration completed successfully
-- This fixes the infinite recursion issue that was causing:
-- Error: {code: 42P17, details: null, hint: null, message: infinite recursion}